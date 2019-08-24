import React from 'react';
import './App.css';
import { Terminal } from 'xterm';
import SerialPort from 'avrgirl-arduino/lib/browser-serialport';

import attachSerial from './attach-serial';

Terminal.applyAddon(attachSerial);

const baudrates = ['110', '300', '600', '1200', '2400', '4800', '9600', '14400', '19200', '38400', '57600', '115200', '128000', '256000'];

let savedBaud;
if(localStorage.baudrate && baudrates.includes(localStorage.baudrate)) {
  savedBaud = localStorage.baudrate;
} 

class App extends React.Component {

  constructor(props) {
    super(props);
    this.termContainer = React.createRef();
  }

  state = {
    baudrate: savedBaud || '57600'
  };

  componentDidMount() {
    this.term = new Terminal();
    this.term.open(this.termContainer.current);
  }

  handleChange = (event) => {
    this.setState({baudrate: event.target.value});
    localStorage.baudrate = event.target.value;
  }

  handleConnect = () => {
    const serial = new SerialPort({baudRate: parseInt(this.state.baudrate)});
    serial.on('open', () => {
      console.log('serial connected', serial);
      serial.isOpen = true;
      this.term.attach(serial);  // Attach the above socket to `term`
    });
    serial.on('error', console.error);
    global.serial = serial;
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          {navigator.serial ? (
            <div style={{margin: '5px', fontSize: '1.5rem'}}>
            baud:
            <select value={this.state.baudrate} onChange={this.handleChange} style={{margin: '5px', fontSize: '1rem'}}>
              {baudrates.map((br) => (<option key={br}>{br}</option>))}
            </select>
            <button onClick={this.handleConnect} style={{margin: '5px', fontSize: '1rem'}}>Connect</button>
          </div>
          ) : (
            <div style={{margin: '5px', fontSize: '1.5rem', color: 'white'}}>
              <a href="https://wicg.github.io/serial/" rel="noopener noreferrer" target="_blank" style={{color: 'white'}}>Web Serial API not available</a>
            </div>
          )}
          
          <div ref={this.termContainer}></div>
        </header>
      </div>
    );
  }
}


export default App;
