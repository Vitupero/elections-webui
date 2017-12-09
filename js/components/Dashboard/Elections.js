/*
* External Dependancies
*/

import React from 'react';
import Socket from 'react-socket';
import {
  Col,
  Form, FormGroup, FormControl, ControlLabel, Button
} from 'react-bootstrap';

import VotesTable from './VotesTable';
/*
* Variables
*/
const GetPositionKey = "getElectionsList";
const LoadResultsKey = "loadResults";
const CurrentGraphId = "currentGraphId";
const ShowResultsKey = "showResults";

/*
* React
*/
export default class Elections extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdownRole: "",
      currentRole: "",
      positions: [],
      graphId: {
        id: null,
        round: null
      }
    };
  }

  componentDidMount() {
    this.sock.socket.emit(CurrentGraphId);
    this.sock.socket.emit(GetPositionKey);
  }

  loadedPositionData(positions) {
    const dropdownRole = positions[0].id;
    this.setState({
      positions,
      dropdownRole
    });
  }

  handlePositionSelectionChange(e){
    this.setState({dropdownRole: e.target.value});
  }

  loadPositionData(){
    const currentRole = this.state.dropdownRole;
    this.setState({ currentRole });
    console.log("LOAD", LoadResultsKey, currentRole);
    this.sock.socket.emit(LoadResultsKey, { role: currentRole });
  }

  handleGraphId(data){
    console.log("Graph ID:", data);
    this.setState({ graphId: data });
  }

  clearGraphId(){
    this.sock.socket.emit(ShowResultsKey, {
      id: null,
      name: null,
      round: null
    });
  }

  getGraphId(){
    const { graphId, positions } = this.state;
    if (!graphId || !graphId.id)
      return "Sabb Graph Proxy";

    let name = graphId.id;
    const position = positions.find(p => p.id == graphId.id);
    if (position)
      name = position.name;

    if (graphId.round >= 0)
      return name + " - Round " + (graphId.round+1);

    return name;
  }

  render() {
    const positions = this.state.positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>);

    return (
      <div>
        <Socket.Listener event={ GetPositionKey } callback={e => this.loadedPositionData(e)} ref={e => this.sock = e} />
        <Socket.Listener event={ CurrentGraphId } callback={e => this.handleGraphId(e)} />

        <Form horizontal>
          <fieldset>
            <FormGroup>
              <Col componentClass={ControlLabel} xs={2}>
                Current Graph:
              </Col>
              <Col xs={8}>
                <FormControl.Static>{ this.getGraphId() }</FormControl.Static>
              </Col>
              <Col xs={2}>
                <Button bsStyle="danger" onClick={() => this.clearGraphId()}>Clear</Button>
              </Col>
            </FormGroup>
            <FormGroup>
              <Col componentClass={ControlLabel} xs={2}>
                Current position:
              </Col>
              <Col xs={8}>
                <FormControl componentClass="select" onChange={e => this.handlePositionSelectionChange(e)} value={this.state.dropdownRole}>
                  { positions }
                </FormControl>
              </Col>
              <Col xs={2}>
                <Button bsStyle="success" onClick={() => this.loadPositionData()} >Preview</Button>
              </Col>
            </FormGroup>
        </fieldset>
        </Form>

        <VotesTable position={this.state.currentRole} />
      </div>
    );
  }
}
