import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { getBasePath } from './util';

// Components
import Layout from './ugc/Layout';

// Styles
import './App.css';

const App = () => {
  const basePath = getBasePath();
  return (
    <Router>
      <Switch>
        <Route
          exact path={`${basePath}settings`}
          render={props => <Layout page="SETTINGS" />}
        />
        <Route
          path={`${basePath}channel/:user`}
          render={props => <Layout page="CHANNEL" />}
        />
        <Route
          path='/'
          render={props => <Layout page="HOME" />}
        />
      </Switch>
    </Router>
  );
}

export default App;
