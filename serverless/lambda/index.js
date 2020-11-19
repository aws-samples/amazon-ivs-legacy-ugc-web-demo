const https = require('https');
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');

const region = 'us-west-2';
const cognitoISP = new AWS.CognitoIdentityServiceProvider({
  apiVersion: '2016-04-18',
  region
});
const ddb = new AWS.DynamoDB();
const ivs = new AWS.IVS({ 
  apiVersion: '2020-07-14', 
  region // Must be in one of the supported regions
});

const {
  COGNITO_USER_POOL_ID,
  COGNITO_USER_POOL_CLIENT_ID,
  CHANNELS_TABLE_NAME
} = process.env;

const response = {
  "statusCode": 200,
  "headers": {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,GET,PUT,POST,DELETE",
    "Access-Control-Allow-Headers": "*",
    "Content-Type": "application/json"
  },
  "body": '',
  "isBase64Encoded": false
};

const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// For IVS channel name remove all special characters except for - and _
const rmSpChar = (str) => {
  return str.replace(/[`~!@#$%^&*()|+=?;:'",.<>\{\}\[\]\\\/]/gi, '');
}

/* Cognito */

// Take line 1
const cognitoErrors = (str) => {
  const lines = str.split(/\n/g);
  return lines[0];
};

// TODO: convert to authorizer
const getJWKS = () => {

  // https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json

  return new Promise((resolve, reject) => {

    https.get(`https://cognito-idp.${region}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`, (resp) => {

      let data = '';
    
      resp.on('data', (chunk) => {
        data += chunk;
      });
    
      resp.on('end', () => {
        // console.log(JSON.parse(data));
        resolve(JSON.parse(data));
      });
    
    }).on("error", (err) => {

      console.log("Error: " + err.message);
      reject(err);

    });

  });

};

// TODO: convert to authorizer
const verifyAccessToken = (event) => {

  return new Promise((resolve, reject) => {

    let header_access_token;
    if (event.headers && event.headers.Authorization) {

      const bearer_token = event.headers.Authorization.split(' ');
      header_access_token = bearer_token[0];

    }

    if (!header_access_token && !event.queryStringParameters.access_token) {

      let errMsg = 'Must provide access token';
      console.log(`verifyAccessToken > missing required fields: ${errMsg}`);
      reject(errMsg);
      return;

    }

    const accessToken = header_access_token || event.queryStringParameters.access_token;

    getJWKS().then(jwks => {

      let pem = jwkToPem(jwks.keys[1]);
      console.log('verifyAccessToken > pem:', pem);
      jwt.verify(accessToken, pem, { algorithms: ['RS256'] }, function(err, decodedToken) {

        if (err) {

          console.log('verifyAccessToken > jwt verify > error:', err);
          reject(err);

        }

        // console.log('verifyAccessToken > decodedToken:', decodedToken);
        resolve({
          accessToken,
          decodedToken
        });

      });
  
    })
    .catch(err => {

      console.log('verifyAccessToken > getJWKS > err:', err);

    });

  });

};

// For demo only, not recommended for Production environment.
exports.preSignUp = (event, context, callback) => {
  console.log("presignup event:", JSON.stringify(event, null, 2));

  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;
  callback(null, event);
};

const _updateUserAttribute = (username, newUserAttr) => {
  return new Promise((resolve, reject) => {

    try {

      console.info("_updateUserAttribute > newUserAttr:", JSON.stringify(newUserAttr, '', 2));

      let params = {
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: username
      };
      console.log(`params:`, JSON.stringify(params, null, 2));

      cognitoISP.adminGetUser(params, function(err, userData) {

        if (err) {

          console.log('_updateUserAttribute > adminGetUser > err:', err);
          reject(err);
          return;

        }

        console.log(`_updateUserAttribute > adminGetUser > userData:`, userData);

        if (!userData) {
          resolve(null);
          return;
        }

        const updatedUserAttributes = [];

        // console.log('userData.UserAttributes:', userData.UserAttributes);

        if (newUserAttr.Name === 'profile') {
          const savedAttrIndex = userData.UserAttributes.findIndex(obj => obj.Name === newUserAttr.Name);
          if (savedAttrIndex !== -1) {
            console.log('_updateUserAttribute > savedAttrIndex:',  savedAttrIndex);
            const savedAttrValueAsJson = JSON.parse(userData.UserAttributes[savedAttrIndex].Value);
            console.log('_updateUserAttribute > savedAttrValueAsJson:', JSON.stringify(savedAttrValueAsJson, null, 2));
            const mergedAttrValue = {
              ...savedAttrValueAsJson,
              ...newUserAttr.Value
            };
            console.log('_updateUserAttribute > mergedAttrValue:', JSON.stringify(mergedAttrValue, null, 2));
            newUserAttr.Value = JSON.stringify(mergedAttrValue);
            updatedUserAttributes.push(newUserAttr);
          }
        } else {
          updatedUserAttributes.push(newUserAttr);
        }

        console.log('_updateUserAttribute > updatedUserAttributes:', JSON.stringify(updatedUserAttributes, null, 2));

        params = {
          UserPoolId: COGNITO_USER_POOL_ID,
          Username: username,
          UserAttributes: updatedUserAttributes
        };
        console.log('_updateUserAttribute > params:', JSON.stringify(params, null, 2));

        cognitoISP.adminUpdateUserAttributes(params, function(err, data) {
          if (err) {
            reject(err);
          }
          resolve({
            userAttributes: updatedUserAttributes,
            updatedResult: data
          });
        });

      });

    } catch(err) {

      console.info("_updateUserAttribute > try/catch:", err);
      reject(err);

    }
  });

};

exports.signUp = (event, context, callback) => {
  console.log("signup event:", JSON.stringify(event, null, 2));

  let payload;

  try {

    payload = JSON.parse(event.body);

  } catch (err) {

    console.log("signup event > parse payload:", JSON.stringify(err, null, 2));
    response.statusCode = 500;
    response.body = JSON.stringify(err);
    callback(null, response);
    return;

  }

  if (!payload || !payload.email || !payload.password || !payload.avatar || !payload.bgColor ) {

    console.log("signup event > missing required field(s): Must provide email, password, avatar and background color");
    response.statusCode = 400;
    response.body = "Must provide email, password, avatar and background color";
    callback(null, response);
    return;

  }

  try {

    const segments = payload.email.split('@');
    const username = segments[0];

    const profile = {
      bgColor: payload.bgColor
    };

    const UserAttributes = [
      {
        Name: 'email',
        Value: payload.email
      },
      {
        Name: 'preferred_username',
        Value: username
      },
      {
        Name: 'picture',
        Value: payload.avatar
      },
      {
        Name: 'profile',
        Value: JSON.stringify(profile)
      }
    ];

    const params = {
      ClientId: COGNITO_USER_POOL_CLIENT_ID,
      Username: payload.email,
      Password: payload.password,
      UserAttributes
    };
    // console.info("signup event > params:", JSON.stringify(params, null, 2));

    cognitoISP.signUp(params, function(err, signUpResult) {

      if (err) {

        console.log("signup event > error:", err, err.stack);
        response.statusCode = 500;
        response.body = cognitoErrors(err.stack);
        console.info("signup event > signUp > error > response:", JSON.stringify(response, '', 2));
        callback(null, response);
        return;

      }

      console.info("signup event > signUp > success > result:", JSON.stringify(signUpResult, '', 2));

      // Add default channel

      const defaultChannel = {
        name: `${rmSpChar(username)}s-live-stream`
      };

      if (payload.channelLatencyMode) {
        defaultChannel.latencyMode = payload.channelLatencyMode;
      }

      if (payload.channelType) {
        defaultChannel.type = payload.channelType;
      }

      const defaultChannelName = `${username}'s live stream`;

      _createChannel(defaultChannel)
        .then((channel) => {

          console.log("signup event > _createChannel > channel:", JSON.stringify(channel, '', 2));

          const channelAttribute = {
            Name: 'profile',
            Value: {
              defaultChannelName,
              defaultChannelDetails: channel
            }
          };

          console.log("signup event > channelAttribute:", JSON.stringify(channelAttribute, '', 2));

          _updateUserAttribute(payload.email, channelAttribute).then(() => {

            const ddbPayload = {
              sub: signUpResult.UserSub,
              username,
              avatar: payload.avatar,
              bgColor: payload.bgColor,
              name: defaultChannelName,
              channelArn: channel.channel.arn,
              channel: channel
            };

            console.log("signup event > ddbPayload:", JSON.stringify(ddbPayload, '', 2));

            _createDdbChannel(ddbPayload).then(() => {

              // For demo only, not recommended for Production
              const authPayload = {
                email: payload.email,
                password: payload.password
              };

              _authUser(authPayload).then((authResult) => {

                console.log("signup event > success:", JSON.stringify(authResult, '', 2));
                response.statusCode = 201;
                response.body = JSON.stringify(authResult, '', 2);
                console.info("signup event > response:", JSON.stringify(authResult, '', 2));
                callback(null, response);

              })
              .catch((err) => {

                console.info("signup event > _authUser > err:", err);
                response.statusCode = 500;
                response.body = JSON.stringify(err.stack);
                callback(null, response);
                return;
    
              });
              

            })
            .catch((err) => {

              console.info("signup event > _createDdbChannel > err:", err);
              response.statusCode = 500;
              response.body = JSON.stringify(err.stack);
              callback(null, response);
              return;
  
            });

          })
          .catch((err) => {

            console.info("signup event > _updateUserAttribute > err:", err);
            response.statusCode = 500;
            response.body = cognitoErrors(err.stack);
            callback(null, response);
            return;

          });

        })
        .catch((err) => {
          
          console.info("signup event > _createChannel > err:", err);
          response.statusCode = 500;
          response.body = err.stack;
          callback(null, response);
          return;

        });

    });

  } catch(err) {

    console.info("signup event > try/catch:", err);
    response.statusCode = 500;
    response.body = err;
    callback(null, response);
    return;
    
  }
};

const _authUser = (payload) => {

  return new Promise((resolve, reject) => {

    try {

      const params = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: COGNITO_USER_POOL_CLIENT_ID,
        AuthParameters: {
          USERNAME: payload.email,
          PASSWORD: payload.password
        }
      };
      console.info("auth event > response:", JSON.stringify(params, null, 2));

      cognitoISP.initiateAuth(params, function(err, data) {

        if (err) {
          console.log("auth event > error:", err, err.stack);
          reject(err);
          return;
        }

        console.log("auth event > success:", JSON.stringify(data, '', 2));
        resolve(data);

      });

    } catch(err) {

      console.info("_authUser > err:", err, err.stack);
      reject(err);
      
    }

  });

};

exports.authUser = (event, context, callback) => {
  console.log("auth event:", JSON.stringify(event, null, 2));

  let payload;
  try {

    payload = JSON.parse(event.body);

  } catch (err) {

    console.log("auth event > parse payload:", JSON.stringify(err, null, 2));
    response.statusCode = 500;
    response.body = JSON.stringify(err);
    callback(null, response);
    return;

  }

  if (!payload || !payload.email || !payload.password ) {

    console.log("auth event > missing required field(s): Must provide email and password");
    response.statusCode = 400;
    response.body = "Must provide email and password";
    callback(null, response);
    return;

  }

  try {

    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: payload.email,
        PASSWORD: payload.password
      }
    };
    console.info("auth event > response:", JSON.stringify(params, null, 2));

    cognitoISP.initiateAuth(params, function(err, data) {

      if (err) {
        console.log("auth event > error:", err, err.stack);
        response.statusCode = 500;
        response.body = cognitoErrors(err.stack);
        console.info("auth event > response:", JSON.stringify(response, '', 2));
        callback(null, response);
        return;
      }

      console.log("auth event > success:", JSON.stringify(data, '', 2));
      response.statusCode = 200;
      response.body = JSON.stringify(data, '', 2);
      console.info("auth event > response:", JSON.stringify(response, '', 2));
      callback(null, response);

    });

  } catch(err) {

    console.info("auth event > err:", err);
    response.statusCode = 500;
    response.body = err.stack;
    callback(null, response);
    return;
    
  }
};

exports.getUserAdmin = (event, context, callback) => {
  console.log("getUserAdmin event:", JSON.stringify(event, null, 2));

  if (!event.queryStringParameters.username) {
    console.log("getUserAdmin event > missing required fields: Must provide username");
    response.statusCode = 400;
    response.body = "Must provide username";
    callback(null, response);
    return;
  }

  try {

    const params = {
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: event.queryStringParameters.username
    };
    console.info("getUserAdmin event > params:", JSON.stringify(params, '', 2));

    cognitoISP.adminGetUser(params, function(err, data) {

      if (err) {
        console.log("getUserAdmin event > error:", err, err.stack);
        response.statusCode = 500;
        response.body = cognitoErrors(err.stack);
        console.info("getUserAdmin event > response:", JSON.stringify(response, '', 2));
        callback(null, response);
        return;
      }

      console.log("getUserAdmin event > success:", JSON.stringify(data, '', 2));
      response.statusCode = 201;
      response.body = JSON.stringify(data, '', 2);
      console.info("getUserAdmin event > success > response:", JSON.stringify(response, '', 2));
      callback(null, response);

    });

  } catch(err) {

    console.info("getUserAdmin event > err:", err, err.stack);
    response.statusCode = 500;
    response.body = err.stack;
    callback(null, response);

  }

};

const _getCognitoUser = (AccessToken) => {
  console.log("_getCognitoUser:", AccessToken);

  return new Promise((resolve, reject) => {
    try {
      const params = {
        AccessToken
      };
      console.info("_getCognitoUser > params:", JSON.stringify(params, '', 2));
  
      cognitoISP.getUser(params, function(err, data) {
        if (err) {
          console.log("_getCognitoUser > error:", err, err.stack);
          reject(err);
          return;
        }
  
        resolve(data);
  
      });
    } catch(err) {
      console.info("_getCognitoUser > err:", err);
      reject(err);
    }
  });
};

exports.getUser = async (event, context, callback) => {
  console.log("getUser event:", JSON.stringify(event, null, 2));

  let header_access_token;
  if (event.headers && event.headers.Authorization) {
    const bearer_token = event.headers.Authorization.split(' ');
    header_access_token = bearer_token[0];
  }

  if (!header_access_token && !event.queryStringParameters.access_token) {
    console.log("getUser event > missing required fields: Must provide access token");
    response.statusCode = 400;
    response.body = "Must provide access token";
    callback(null, response);
    return;
  }

  try {
    
    const userData = await _getCognitoUser(header_access_token || event.queryStringParameters.access_token);
    
    // Convert `profile` attribute value from string to JSON
    if (userData && userData.UserAttributes && userData.UserAttributes.length) {
      let len = userData.UserAttributes.length;
      while(--len >= 0) {
        if (userData.UserAttributes[len].Name === 'profile') {
          userData.UserAttributes[len].Value = JSON.parse(userData.UserAttributes[len].Value);
          break;
        }
      }
    }

    console.log("getUser event > success:", JSON.stringify(userData, '', 2));
    response.statusCode = 200;
    response.body = JSON.stringify(userData, '', 2);
    console.info("getUser event > success > response:", JSON.stringify(response, '', 2));
    callback(null, response);

  } catch(err) {

    console.info("getUser event > err:", err, err.stack);
    response.statusCode = 500;
    response.body = cognitoErrors(err.stack);
    callback(null, response);

  }

};

exports.updateUserAttribute = (event, context, callback) => {
  console.log("updateUserAttribute event:", JSON.stringify(event, null, 2));

  verifyAccessToken(event).then(result => {

    const { accessToken, decodedToken } = result; 

    let payload;

    try {

      payload = JSON.parse(event.body);

    } catch (err) {

      console.log("updateUserAttribute event > parse payload:", JSON.stringify(err, null, 2));
      response.statusCode = 500;
      response.body = JSON.stringify(err);
      callback(null, response);
      return;

    }

    if (!payload || !payload.Name || !payload.Value) {

      console.log("updateUserAttribute event > missing required field(s): Must provide Name and Value");
      response.statusCode = 400;
      response.body = "Must provide Must provide Name and Value";
      callback(null, response);
      return;

    }

    if (payload.Value.defaultChannelDetails) {
      delete payload.Value.defaultChannelDetails;
      if (!Object.keys(payload.Value).length) {
        console.log("updateUserAttribute event > defaultChannelDetails");
        response.statusCode = 200;
        response.body = '';
        console.info("updateUserAttribute event > defaultChannelDetails > response:", JSON.stringify(response, '', 2));
        callback(null, response);
        return;
      }
    }

    _updateUserAttribute(decodedToken.username, payload).then((updateAttrsResult) => {

      console.info("updateUserAttribute event > _updateUserAttribute > updateAttrsResult:", JSON.stringify(updateAttrsResult, '', 2));
      
      _updateDDBChannelUserProfile(accessToken).then(() => {

        console.log("updateUserAttribute event > success:", JSON.stringify(updateAttrsResult, '', 2));
        response.statusCode = 200;
        response.body = JSON.stringify(updateAttrsResult, '', 2);
        console.info("updateUserAttribute event > response:", JSON.stringify(response, '', 2));
        callback(null, response);

      })
      .catch((err) => {

        console.info("updateUserAttribute event > _updateDDBChannelUserProfile > err:", err);
        response.statusCode = 500;
        response.body = JSON.stringify(err);
        callback(null, response);
        return;
  
      });

    })
    .catch((err) => {

      console.info("updateUserAttribute event > updateUserAttribute > err:", err);
      response.statusCode = 500;
      response.body = cognitoErrors(err.stack);
      callback(null, response);
      return;

    });

  })
  .catch(err => {
    
    console.log("updateUserAttribute event > verifyAccessToken > error:", err);
    response.statusCode = 500;
    response.body = err;
    console.info("updateUserAttribute event > verifyAccessToken > error > response:", JSON.stringify(response, '', 2));
    callback(null, response);
    return;

  });

};

exports.changePassword = (event, context, callback) => {
  console.log("changePassword event:", JSON.stringify(event, null, 2));

  verifyAccessToken(event).then(result => {

    const { accessToken } = result; 

    let payload;

    try {

      payload = JSON.parse(event.body);

    } catch (err) {

      console.log("changePassword event > parse payload:", JSON.stringify(err, null, 2));
      response.statusCode = 500;
      response.body = JSON.stringify(err);
      callback(null, response);
      return;

    }

    if (!payload || !payload.oldPassword || !payload.newPassword) {

      console.log("changePassword event > missing required field(s): Must provide old and new password");
      response.statusCode = 400;
      response.body = "Must provide Must provide old and new password";
      callback(null, response);
      return;

    }

    var params = {
      AccessToken: accessToken,
      PreviousPassword: payload.oldPassword,
      ProposedPassword: payload.newPassword
    };
    cognitoISP.changePassword(params, function(err, data) {
      if (err) {
        console.log("changePassword event > error:", err, err.stack);
        response.statusCode = 500;
        response.body = cognitoErrors(err.stack);
        console.info("changePassword event > response:", JSON.stringify(response, '', 2));
        callback(null, response);
        return;
      }

      console.log("changePassword event > success:", JSON.stringify(data, '', 2));
      response.statusCode = 200;
      response.body = JSON.stringify(data, '', 2);
      console.info("changePassword event > success > response:", JSON.stringify(response, '', 2));
      callback(null, response);
    });


  })
  .catch(err => {
    
    console.log("changePassword event > verifyAccessToken > error:", err);
    response.statusCode = 500;
    response.body = err;
    console.info("changePassword event > verifyAccessToken > error > response:", JSON.stringify(response, '', 2));
    callback(null, response);
    return;

  });

};

exports.deleteUser = (event, context, callback) => {
  console.log("deleteUser event:", JSON.stringify(event, null, 2));

  verifyAccessToken(event).then(result => {

    const { decodedToken } = result; 

    try {

      const params = {
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: decodedToken.username
      };

      // console.info("delete event > params:", JSON.stringify(params, '', 2));

      cognitoISP.adminGetUser(params, function(err, userData) {
        if (err) {
          console.log("delete event > adminGetUser > error:", err, err.stack);
          response.statusCode = 500;
          response.body = cognitoErrors(err.stack);
          console.info("delete event > adminGetUser > response:", JSON.stringify(response, '', 2));
          callback(null, response);
          return;
        }

        console.log("delete event > userData:", JSON.stringify(userData, '', 2));

        const profileAttr = userData.UserAttributes.find(obj => obj.Name === 'profile');
        console.log("delete event > profileAttr:", JSON.stringify(profileAttr, '', 2));
        
        let userDefaultChannelArn;
        if (profileAttr) {
          const savedAttrValueAsJson = JSON.parse(profileAttr.Value);
          if (savedAttrValueAsJson.defaultChannelDetails) {
            userDefaultChannelArn = savedAttrValueAsJson.defaultChannelDetails.channel.arn;
          }
        }

        console.log("delete event > userDefaultChannelArn:", JSON.stringify(userDefaultChannelArn, '', 2));

        cognitoISP.adminDisableUser(params, function(err, data) {

          if (err) {
            console.log("delete event > disable > error:", err, err.stack);
            response.statusCode = 500;
            response.body = cognitoErrors(err.stack);
            console.info("delete event > disable > response:", JSON.stringify(response, '', 2));
            callback(null, response);
            return;
          }

          cognitoISP.adminDeleteUser(params, function(err, data) {
            
            if (err) {
              console.log("delete event > delete > error:", err, err.stack);
              response.statusCode = 500;
              response.body = cognitoErrors(err.stack);
              console.info("delete event  > delete> response:", JSON.stringify(response, '', 2));
              callback(null, response);
              return;
            }

            if (userDefaultChannelArn) {
            _deleteChannel(userDefaultChannelArn)
              .then((data) => {

                const subAttr = userData.UserAttributes.find(obj => obj.Name === 'sub');
                console.log("delete event > preferredUsernameAttr:", JSON.stringify(subAttr, '', 2));

                _deleteDdbChannel(subAttr.Value).then(() => {

                  console.log("delete event > delete > success:", JSON.stringify(data, '', 2));
                  response.statusCode = 200;
                  // response.body = JSON.stringify(data, '', 2);
                  console.info("delete event > delete > response:", JSON.stringify(response, '', 2));
                  callback(null, response);

                })
                .catch((err) => {
              
                  console.info("delete event > _deleteDdbChannel > err:", err);
                  response.statusCode = 500;
                  response.body = err;
                  callback(null, response);
                  return;
        
                });

              })
              .catch((err) => {
              
                console.info("delete event > _deleteChannel > err:", err);
                response.statusCode = 500;
                response.body = err;
                callback(null, response);
                return;
      
              });

            } else {

              console.log("delete event > delete > success:", JSON.stringify(data, '', 2));
              response.statusCode = 200;
              // response.body = JSON.stringify(data, '', 2);
              console.info("delete event > delete > response:", JSON.stringify(response, '', 2));
              callback(null, response);

            }

          });

        });

      });

    } catch(err) {
      console.info("create event > try/catch:", err);
      response.statusCode = 500;
      response.body = err;
      callback(null, response);
    }
  
  })
  .catch(err => {
    
    console.log("deleteUser event > verifyAccessToken > error:", err);
    response.statusCode = 500;
    response.body = err;
    console.info("deleteUser event > verifyAccessToken > error > response:", JSON.stringify(response, '', 2));
    callback(null, response);
    return;

  });

};

/* DDB */

const _createDdbChannel = async (payload) => {

  try {
    const result = await ddb.putItem({
      TableName: CHANNELS_TABLE_NAME,
      Item: {
        'Id': { S: payload.sub },
        'Username': { S: payload.username },
        'Avatar': { S: payload.avatar },
        'BgColor': { S: payload.bgColor },
        'Name': { S: payload.name },
        'ChannelArn': { S: payload.channelArn },
        'Channel': { S: JSON.stringify(payload.channel) },
        'ChannelStatus': { S: '' },
        'IsLive': { BOOL: false }
      }
    }).promise();

    console.info("_createDdbChannel > result:", result);

    return result;
  } catch(err) {
    console.info("_createDdbChannel > err:", err, err.stack);
    throw new Error(err);
  }

};

const _updateDDBChannelUserProfile = async (accessToken) => {

  try {

    const userData = await _getCognitoUser(accessToken);
    const subAttr = userData.UserAttributes.find(obj => obj.Name === 'sub');
    const preferredUsernameAttr = userData.UserAttributes.find(obj => obj.Name === 'preferred_username');
    const pictureAttr = userData.UserAttributes.find(obj => obj.Name === 'picture');
    const profileAttr = userData.UserAttributes.find(obj => obj.Name === 'profile');
    const profileAttrValue = JSON.parse(profileAttr.Value);
    
    const params = {
      TableName: CHANNELS_TABLE_NAME,
      Key: {
        'Id': {
          S: subAttr.Value
        },
      },
      ExpressionAttributeNames: {
        '#Username': 'Username', 
        '#Avatar': 'Avatar', 
        '#BgColor': 'BgColor', 
        '#Name': 'Name',
        '#Channel': 'Channel'
       }, 
       ExpressionAttributeValues: {
        ':username': {
          S: preferredUsernameAttr.Value
        },
        ':avatar': {
          S: pictureAttr.Value
        }, 
        ':bgColor': {
          S: profileAttrValue.bgColor
        }, 
        ':name': {
          S: profileAttrValue.defaultChannelName
        }, 
        ':channel': {
          S: JSON.stringify(profileAttrValue.defaultChannelDetails)
        }
      },
      UpdateExpression: 'SET #Username = :username, #Avatar = :avatar, #BgColor = :bgColor, #Name = :name, #Channel = :channel',
      ReturnValues: "ALL_NEW"
    };

    console.info("_updateDDBChannelUserProfile > params:", JSON.stringify(params, null, 2));

    const result = await ddb.updateItem(params).promise();

    return result;
  } catch(err) {
    console.info("_updateDDBChannelUserProfile > err:", err, err.stack);
    throw new Error(err);
  }

};

const _updateDDBChannelIsLive = async (isLive, id, stream) => {

  try {
    const params = {
      TableName: CHANNELS_TABLE_NAME,
      Key: {
        'Id': {
          S: id
        },
      },
      ExpressionAttributeNames: {
        '#IsLive': 'IsLive', 
        '#ChannelStatus': 'ChannelStatus'
       }, 
       ExpressionAttributeValues: {
        ':isLive': {
          BOOL: isLive
        }, 
        ':channelStatus': {
          S: isLive ? JSON.stringify(stream) : '{}'
        }
      },
      UpdateExpression: 'SET #IsLive = :isLive, #ChannelStatus = :channelStatus',
      ReturnValues: "ALL_NEW"
    };

    console.info("_updateDDBChannelIsLive > params:", JSON.stringify(params, null, 2));

    const result = await ddb.updateItem(params).promise();

    return result;
  } catch(err) {
    console.info("_updateDDBChannelIsLive > err:", err, err.stack);
    throw new Error(err);
  }

};

exports.get = async(event, context, callback) => {
  console.log("get event:", JSON.stringify(event, null, 2));

  try {

    const params = {
      TableName: CHANNELS_TABLE_NAME
    };

    if (event.queryStringParameters && event.queryStringParameters.username) {
      console.log("get event > by Id");

      params.Key = {
        'Id': {
          S: event.queryStringParameters.username
        }
      };

      console.info("get event > by Id > params:", JSON.stringify(params, null, 2));
      
      const result = await ddb.getItem(params).promise();

      console.info("get event > by Id > result:", JSON.stringify(result, null, 2));

      if (!result.Item) {
        response.statusCode = 200;
        response.body = JSON.stringify({});
        callback(null, response);
        return;
      }

      const filtered = {
        username: result.Item.Username.S,
        avatar: result.Item.Avatar.S,
        bgColor: result.Item.BgColor.S,
        channelArn: result.Item.ChannelArn ? result.Item.ChannelArn.S : '',
        channelName: result.Item.Name ? result.Item.Name.S : '',
        channel: result.Item.Channel ? JSON.parse(result.Item.Channel.S) : {},
        channelStatus: result.Item.ChannelStatus ? result.Item.ChannelStatus.S : {},
        isLive: result.Item.IsLive && result.Item.IsLive.BOOL ? 'Yes' : 'No'
      };

      response.statusCode = 200;
      response.body = JSON.stringify(filtered, '', 2);

      console.info("get event > by Id > response:", JSON.stringify(response, null, 2));

      callback(null, response);

      return;
    }

    console.log("get event > list");
    
    console.info("get event > list > params:", JSON.stringify(params, null, 2));

    const result = await ddb.scan(params).promise();

    console.info("get event > list > result:", JSON.stringify(result, null, 2));

    if (!result.Items) {
      response.statusCode = 200;
      response.body = JSON.stringify([]);
      callback(null, response);
      return;
    }

    let filteredItems = [];
    let prop;
    for (prop in result.Items) {
      let channelStatus = {};
      try {
        channelStatus = JSON.parse(result.Items[prop].ChannelStatus.S);
      } catch(err) {}

      filteredItems.push({
        username: result.Items[prop].Username.S,
        avatar: result.Items[prop].Avatar.S,
        bgColor: result.Items[prop].BgColor.S,
        channelArn: result.Items[prop].ChannelArn ? result.Items[prop].ChannelArn.S : '',
        channelName: result.Items[prop].Name ? result.Items[prop].Name.S : '',
        channel: result.Items[prop].Channel ? JSON.parse(result.Items[prop].Channel.S) : {},
        channelStatus: channelStatus,
        isLive: result.Items[prop].IsLive && result.Items[prop].IsLive.BOOL ? 'Yes' : 'No'
      });
    }

    response.statusCode = 200;
    response.body = JSON.stringify(filteredItems, '', 2);
    
    console.info("get event > list > response:", JSON.stringify(response, null, 2));

    callback(null, response);

  } catch(err) {
    console.info("get event > err:", err, err.stack);
    response.statusCode = 500;
    response.body = err.stack;
    callback(null, response);
  }
};

const _deleteDdbChannel = async (sub) => {

  try {
    const params = {
      TableName: CHANNELS_TABLE_NAME,
      Key: {
        'Id': {
          S: sub
        },
      },
    };
    console.info("_deleteDdbChannel > params:", JSON.stringify(params, null, 2));
  
    const result = await ddb.deleteItem(params).promise();
    console.info("_deleteDdbChannel > result:", JSON.stringify(result, null, 2));

    return result;
  } catch(err) {
    console.info("_deleteDdbChannel > err:", err, err.stack);
    throw new Error(err);
  }

};

const _isLive = async(counter) => {
  console.info("_isLive > counter:", counter);

  const liveStreams = await ivs.listStreams({}).promise();
  console.info("_isLive > liveStreams:", liveStreams);

  if (!liveStreams) {
    console.log("_isLive: No live streams. Nothing to check");
    return;
  }

  const result = await ddb.scan({ TableName: CHANNELS_TABLE_NAME }).promise();
  if (!result.Items) {
    console.log("_isLive: No channels. Nothing to check");
    return;
  }

  let len = result.Items.length;
  while(--len >= 0) {

    const channel = JSON.parse(result.Items[len].Channel.S);
    console.log("_isLive > channel:", JSON.stringify(channel, null, 2));
    const liveStream = liveStreams.streams.find(obj => obj.channelArn === channel.channel.arn);
    console.log("_isLive > liveStream:", JSON.stringify(liveStream, null, 2));

    if (liveStream) {
      await _updateDDBChannelIsLive(true, result.Items[len].Id.S, liveStream);
    } else {
      await _updateDDBChannelIsLive(false, result.Items[len].Id.S, { channelArn: channel.channel.arn });
    }
  }
};

exports.isLive = async(event) => {
  console.log("isLive event:", JSON.stringify(event, null, 2));

  // Run three times before the next scheduled event every 1 minute
  const waitTime = 15 * 1000; // 15 seconds
  let i = 0;
  _isLive(i + 1); // run immediately
  for(i; i < 2; i++) {
    await new Promise(r => setTimeout(r, waitTime)); // wait 15 seconds
    console.log("isLive event: waited 15 seconds");
    _isLive(i + 1);
  }

  console.log("isLive event: end");

  return;
};

/* IVS */

const _createChannel = async (payload) => {

  const params = {
    latencyMode: payload.latencyMode || 'NORMAL',
    name: payload.name,
    tags: payload.tags || {},
    type: payload.type || 'BASIC'
  };

  console.log("_createChannel > params:", JSON.stringify(params, null, 2));

  try {

    const result = await ivs.createChannel(params).promise();
    // console.info("_createChannel > result:", result);
    return result;

  } catch(err) {

    // console.info("_createChannel > err:", err, err.stack);
    throw new Error(err);
    
  }
};

const _deleteChannel = async (arn) => {

  const params = {
    arn
  };

  console.log("_deleteChannel > params:", JSON.stringify(params, null, 2));

  try {

    const result = await ivs.deleteChannel(params).promise();
    // console.info("_deleteChannel > result:", result);
    return result;

  } catch(err) {

    // console.info("_deleteChannel > err:", err, err.stack);
    throw new Error(err);
    
  }
};

const _stopStream = async (params) => {

  console.log("_stopStream > params:", JSON.stringify(params, null, 2));

  try {

    const result = await ivs.stopStream(params).promise();
    // console.info("_stopStream > result:", result);
    return result;

  } catch(err) {

    console.info("_stopStream > err:", err);
    console.info("_stopStream > err.stack:", err.stack);

    // Ignore error
    if (/ChannelNotBroadcasting/.test(err)) {
      return;
    }

    throw new Error(err);
    
  }
};

exports.createChannel = async(event, context, callback) => {
  console.log("createChannel event:", JSON.stringify(event, null, 2));

  let payload;

  try {

    payload = JSON.parse(event.body);

  } catch (err) {

    console.log("createChannel event > parse payload:", JSON.stringify(err, null, 2));
    response.statusCode = 500;
    response.body = JSON.stringify(err);
    callback(null, response);
    return;

  }

  if (!payload || !payload.name) {
    console.log("createChannel event > missing required field(s): Must provide name.");
    response.statusCode = 400;
    response.body = "Must provide name.";
    callback(null, response);
    return;
  }

  const params = {
    latencyMode: payload.latencyMode || 'NORMAL',
    name: payload.name,
    tags: payload.tags || {},
    type: payload.type || 'BASIC'
  };

  console.log("createChannel event > params:", JSON.stringify(params, null, 2));

  /*try {

    const result = await ivs.createChannel(params).promise();
    console.info("createChannel event > result:", result);
    response.statusCode = 200;
    response.body = JSON.stringify(result);
    
    callback(null, response);

  } catch(err) {

    console.info("getChannels event > err:", err, err.stack);
    response.statusCode = 500;
    response.body = err.stack;
    callback(null, response);
    
  }*/

  callback(null, _createChannel(params));

};

exports.createStreamKey = async(event, context, callback) => {
  console.log("createStreamKey event:", JSON.stringify(event, null, 2));

  let payload;

  try {

    payload = JSON.parse(event.body);

  } catch (err) {

    console.log("createStreamKey event > parse payload:", JSON.stringify(err, null, 2));
    response.statusCode = 500;
    response.body = JSON.stringify(err);
    callback(null, response);
    return;

  }

  if (!payload || !payload.channelArn) {
    console.log("createStreamKey event > missing required field(s): Must provide channelArn.");
    response.statusCode = 400;
    response.body = "Must provide channelArn.";
    callback(null, response);
    return;
  }

  const params = {
    channelArn: payload.channelArn,
    tags: payload.tags || {}
  };

  console.log("createStreamKey event > params:", JSON.stringify(params, null, 2));

  try {

    const result = await ivs.createStreamKey(params).promise();
    console.info("createStreamKey event > result:", result);
    response.statusCode = 200;
    response.body = JSON.stringify(result);
    
    callback(null, response);

  } catch(err) {

    console.info("createStreamKey event > err:", err, err.stack);
    response.statusCode = 500;
    response.body = err.stack;
    callback(null, response);
    
  }
};

exports.getChannels = async(event, context, callback) => {
  console.log("getChannels event:", JSON.stringify(event, null, 2));

  const params = {};

  try {

    if (event.queryStringParameters && event.queryStringParameters.channelArn) {
      console.log("getChannels event > by channelArn");
      params.arn = event.queryStringParameters.channelArn;

      const result = await ivs.listChannel(params).promise();
      console.info("getChannels event > result:", result);
      response.statusCode = 200;
      response.body = JSON.stringify(result);
      
      callback(null, response);
      return;
    }

    if (event.queryStringParameters) {
      if (event.queryStringParameters.maxResults) {
        params.maxResults = event.queryStringParameters.maxResults;
      }
      if (event.queryStringParameters.nextToken) {
        params.nextToken = event.queryStringParameters.nextToken;
      }
    }

    console.log("getChannels event > list");

    const result = await ivs.listChannels(params).promise();
    console.info("getChannels event > result:", result);
    response.statusCode = 200;
    response.body = JSON.stringify(result);
    
    callback(null, response);

  } catch(err) {

    console.info("getChannels event > err:", err, err.stack);
    response.statusCode = 500;
    response.body = err.stack;
    callback(null, response);
    
  }
};

exports.getStreams = async(event, context, callback) => {
  console.log("getStreams event:", JSON.stringify(event, null, 2));

  const params = {};
  
  try {

    if (event.queryStringParameters && event.queryStringParameters.channelArn) {

      console.log("getStreams event > by channelArn");
      params.channelArn = event.queryStringParameters.channelArn;
      console.log("getStreams event > by channelArn > params:", JSON.stringify(params, null, 2));

      const result = await ivs.getStream(params).promise();
      console.log("getStreams event > result:", result);
      response.statusCode = 200;
      response.body = JSON.stringify(result);
      
      callback(null, response);
      return;
      
    }

    console.log("getStreams event > list");

    if (event.queryStringParameters) {
      if (event.queryStringParameters.maxResults) {
        params.maxResults = event.queryStringParameters.maxResults;
      }
      if (event.queryStringParameters.nextToken) {
        params.nextToken = event.queryStringParameters.nextToken;
      }
    }

    const result = await ivs.listStreams(params).promise();
    console.info("getStreams event > result:", result);
    response.statusCode = 200;
    response.body = JSON.stringify(result);
    
    callback(null, response);

  } catch(err) {

    console.info("getStreams event > err:", err, err.stack);
    response.statusCode = 500;
    response.body = err.stack;
    callback(null, response);
    
  }
};

exports.getStreamKeys = async(event, context, callback) => {
  console.log("getStreamKeys event:", JSON.stringify(event, null, 2));

  if (!event.queryStringParameters && !event.queryStringParameters.channelArn) {
    console.log("getStreamKeys event > missing required field(s): Must provide channelArn.");
    response.statusCode = 400;
    response.body = "Must provide channelArn.";
    callback(null, response);
    return;
  }

  const params = {
    arn: event.queryStringParameters.channelArn
  };

  try {

    if (event.queryStringParameters && event.queryStringParameters.channelArn) {
      console.log("getStreamKeys event > by channelArn");
      params.arn = event.queryStringParameters.channelArn;

      const result = await ivs.getStreamKey(params).promise();
      console.info("getStreamKeys event > result:", result);
      response.statusCode = 200;
      response.body = JSON.stringify(result);
      
      callback(null, response);
      return;
    }

    console.log("getStreamKeys event > list");

    if (event.queryStringParameters.maxResults) {
      params.maxResults = event.queryStringParameters.maxResults;
    }
    if (event.queryStringParameters.nextToken) {
      params.nextToken = event.queryStringParameters.nextToken;
    }

    const result = await ivs.listStreamKeys(params).promise();
    console.info("getStreamKeys event > result:", result);
    response.statusCode = 200;
    response.body = JSON.stringify(result);
    
    callback(null, response);

  } catch(err) {

    console.info("getStreamKeys event > err:", err, err.stack);
    response.statusCode = 500;
    response.body = err.stack;
    callback(null, response);
    
  }
};

exports.resetDefaultStreamKey = (event, context, callback) => {
  console.log("resetDefaultStreamKey event:", JSON.stringify(event, null, 2));

  verifyAccessToken(event).then(result => {

    const { accessToken, decodedToken } = result; 

    const getUserParams = {
      AccessToken: accessToken
    };
    console.info("resetDefaultStreamKey event > params:", JSON.stringify(getUserParams, '', 2));

    cognitoISP.getUser(getUserParams, function(err, userData) {

      if (err) {
        console.log("resetDefaultStreamKey event > getUser > error:", err, err.stack);
        response.statusCode = 500;
        response.body = cognitoErrors(err.stack);
        console.log("resetDefaultStreamKey event > getUser > response:", JSON.stringify(response, '', 2));
        callback(null, response);
        return;
      }

      console.log('userData.UserAttributes:', JSON.stringify(userData.UserAttributes, '', 2));
      
      const profile = userData.UserAttributes.find(obj => obj.Name === 'profile');
      
      console.log('profile:', JSON.stringify(profile, '', 2));

      if (!profile) {
        console.log("resetDefaultStreamKey event > getUser > error: No default channel");
        response.statusCode = 500;
        response.body = "No default channel";
        console.log("resetDefaultStreamKey event > getUser > response:", JSON.stringify(response, '', 2));
        callback(null, response);
        return;
      }
          
      const profileValueAsJson = JSON.parse(profile.Value);

      console.log("resetDefaultStreamKey event > profileValueAsJson:", JSON.stringify(profileValueAsJson, '', 2));

      const stopStreamParams = {
        channelArn: profileValueAsJson.defaultChannelDetails.channel.arn
      };
      console.log("resetDefaultStreamKey event > stopStreamParams:", JSON.stringify(stopStreamParams, '', 2));

      _stopStream(stopStreamParams).then(() => {

        const deleteStreamKeyParams = {
          arn: profileValueAsJson.defaultChannelDetails.streamKey.arn
        };
        console.log("resetDefaultStreamKey event > deleteStreamKeyParams:", JSON.stringify(deleteStreamKeyParams, '', 2));

        // Quota limit 1 - delete then add

        ivs.deleteStreamKey(deleteStreamKeyParams, function(err) {
          if (err) {
            console.log("resetDefaultStreamKey event > deleteStreamKey > error:", err, err.stack);
            response.statusCode = 500;
            response.body = cognitoErrors(err.stack);
            console.info("resetDefaultStreamKey event > deleteStreamKey > response:", JSON.stringify(response, '', 2));
            callback(null, response);
            return;
          }

          const createStreamKeyParams = {
            channelArn: profileValueAsJson.defaultChannelDetails.channel.arn
          };
          console.log("resetDefaultStreamKey event > createStreamKeyParams:", JSON.stringify(createStreamKeyParams, '', 2));

          ivs.createStreamKey(createStreamKeyParams, function(err, newStreamKey) {
            if (err) {
              console.log("resetDefaultStreamKey event > createStreamKey > error:", err, err.stack);
              response.statusCode = 500;
              response.body = cognitoErrors(err.stack);
              console.info("resetDefaultStreamKey event > createStreamKey > response:", JSON.stringify(response, '', 2));
              callback(null, response);
              return;
            }

            const newAttribute = {
              Name: 'profile',
              Value: {
                defaultChannelDetails: {
                  channel: profileValueAsJson.defaultChannelDetails.channel,
                  streamKey: newStreamKey.streamKey
                }
              }
            };
            
            _updateUserAttribute(decodedToken.username, newAttribute).then((updateAttrsResult) => {

              _updateDDBChannelUserProfile(accessToken).then(() => {

                console.log("resetDefaultStreamKey event > success:", JSON.stringify(newStreamKey, '', 2));
                response.statusCode = 200;
                response.body = JSON.stringify(newStreamKey, '', 2);
                console.log("resetDefaultStreamKey event > response:", JSON.stringify(response, '', 2));
                callback(null, response);
              
              })
              .catch((err) => {
        
                console.info("resetDefaultStreamKey event > _updateDDBChannelUserProfile > err:", err);
                response.statusCode = 500;
                response.body = JSON.stringify(err);
                callback(null, response);
                return;
          
              });
        
            })
            .catch((err) => {
        
              console.info("resetDefaultStreamKey event > _updateUserAttribute > err:", err);
              response.statusCode = 500;
              response.body = cognitoErrors(err.stack);
              callback(null, response);
              return;
        
            });
        
          });

        });
      
      })
      .catch((err) => {
      
        console.info("resetDefaultStreamKey event > _stopStream > err:", err);
        response.statusCode = 500;
        response.body = JSON.stringify(err);
        callback(null, response);
        return;
  
      });

    });

  })
  .catch(err => {
    
    console.log("resetStreamKey event > verifyAccessToken > error:", err);
    response.statusCode = 500;
    response.body = err;
    console.info("resetStreamKey event > verifyAccessToken > error > response:", JSON.stringify(response, '', 2));
    callback(null, response);
    return;

  });
};