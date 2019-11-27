import React from 'react'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import './assets/css/App.css'
import Tab from 'react-bootstrap/Tab'
import Tabs from 'react-bootstrap/Tabs'
import DuplicateCheck from "./Duplicate"
import Generator from "./Generator";
import ValidatorWizard from "./ValidatorWizard"
import ValidatorInput from "./ValidatorInput";

function App() {
  return (
    <div>
      <Navbar bg="dark" variant="dark" className="mb-2">
        <Navbar.Brand href="#home">{'Swift Validator'}</Navbar.Brand>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link href="./static.html">Static Version</Nav.Link>
          </Nav>
        </Navbar.Collapse>
        <Navbar.Collapse className="justify-content-end">
          <Navbar.Text>
            Version: <strong>{process.env.REACT_APP_GIT_SHA}</strong>
          </Navbar.Text>
        </Navbar.Collapse>
      </Navbar>
      <Tabs defaultActiveKey="home" id="uncontrolled-tab-example">
        <Tab eventKey="home" title="Validator">
          <ValidatorInput />
        </Tab>
        <Tab eventKey="duplicate" title="Duplicate check">
          <DuplicateCheck />
        </Tab>
        <Tab eventKey="generator" title="Order generator">
          <Generator />
        </Tab>
        <Tab eventKey="validatorWizard" title="Validator wizard">
          <ValidatorWizard />
        </Tab>
      </Tabs>
    </div>
  )
}

export default App;
