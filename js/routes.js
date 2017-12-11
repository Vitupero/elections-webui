import React from 'react';
import { Route } from 'react-router';

import { 
  PositionList, EditPosition, ViewPosition, 
  EditPerson, 
} from './components/Edit';
import Dashboard from './components/Dashboard';

export default (
  <Route>
    <Route path="/edit/person/create/:posId" component={EditPerson} />
    <Route path="/edit/person/create" component={EditPerson} />
    <Route path="/edit/person/:id" component={EditPerson} />
    <Route path="/edit/position/:id/edit" component={EditPosition} />
    <Route path="/edit/position/:id" component={ViewPosition} />
    <Route path="/edit" component={PositionList} />
    <Route path="/" component={Dashboard} />
  </Route>
);
