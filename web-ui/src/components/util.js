import * as config from '../config';
import { AVATAR_LIST } from '../constants';

export const validateEmail = (email) => {
  if (/^\w+([.\-+]?\w+)*@\w+([.\-+]?\w+)*(\.\w{2,3})+$/.test(email)) {
    return (true);
  }
  return (false);
}

// To check a password between 8 to 48 characters which contain at least one lowercase letter, 
// one uppercase letter, one numeric digit, and one special character
export const validatePassword = (password) => {
  if(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,48}$/.test(password)) { 
    return (true);
  }
  return (false);
}

export const getApiUrlBase = () => {
  let urlBase = `${config.UGC_API}`;
  if (config.UGC_API.charAt(config.UGC_API.length -1) !== '/') {
    urlBase += '/';
  }
  return urlBase;
}

export const getBasePath = () => {
  let basePath = `${config.UGC_PATH}`;
  if (config.UGC_PATH.charAt(config.UGC_PATH.length -1) !== '/') {
    basePath += '/';
  }
  return basePath;
}

export const getAvatarUrl = (avatar) => {
  for (let i=0; i<AVATAR_LIST.length; i++) {
    if (AVATAR_LIST[i].name === avatar) {
      return `${process.env.PUBLIC_URL}/${AVATAR_LIST[i].image}`
    }
  }
  return `${process.env.PUBLIC_URL}/${AVATAR_LIST[0].image}`; // default avatar
}

export const setWithExpiry = (key, value, ttl) => {
	const now = new Date()
	// `item` is an object which contains the original value
	// as well as the time when it's supposed to expire
	const item = {
		value: value,
		expiry: now.getTime() + (ttl * 1000), // ttl is in seconds
	}
	sessionStorage.setItem(key, JSON.stringify(item));
}

export const getWithExpiry = (key) => {
	const itemStr = sessionStorage.getItem(key)
	// if the item doesn't exist, return null
	if (!itemStr) {
		return null;
	}
	const item = JSON.parse(itemStr);
	const now = new Date();
	// compare the expiry time of the item with the current time
	if (now.getTime() > item.expiry) {
		// If the item is expired, delete the item from storage
		// and return null
		sessionStorage.removeItem(key);
		return null;
	}
	return item.value;
}

export const removeSession = (key) => {
  sessionStorage.removeItem(key);
}

export const copyTextToClipboard = (text) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
    .then(() => {
      console.log(`${text} copied to clipboard`);
    }, (err) => {
      console.log('Could not copy text: ', err);
    });
  }
}
