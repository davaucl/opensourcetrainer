# Trainer Open Source

A web application to control smart bike trainers using Web Bluetooth. Currently supports the Wahoo KICKR v5.

## Features
- Connect to KICKR trainers via Bluetooth
- Control trainer resistance
- Monitor real-time power output

### Limitations
- Cadence data is not available via BLE in the FTMS profile, cadence sent through ANT+

## Setup

### Prerequisites
- Node.js (v16 or later)
- A Web Bluetooth compatible browser (Chrome, Edge, or other Chromium-based browsers)
- A Wahoo KICKR trainer Firmware v4.2.3 or later

### Installation
1. Clone the repository

2. Install dependencies:
bash
npm install

3. Start the development server:
bash
npm run dev

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Navigate to the Config page to test your connection
2. Connect to your KICKR using the "Connect to KICKR" button
3. Request control of the trainer
4. Start the workout
5. Set target power to verify ERG mode control

## Technical Details

### Bluetooth Implementation

This project uses the Fitness Machine Service (FTMS) Bluetooth profile to communicate with the trainer. Key characteristics used:

#### Indoor Bike Data (0x2AD2)
Provides real-time data from the trainer including:
- Current power output

#### Fitness Machine Control Point (0x2AD9)
Used to control the trainer. Key commands:
- 0x00: Request Control
- 0x05: Set Target Power (ERG mode)
- 0x07: Start Workout
- 0x08: Stop Workout

Response Format:
[0x80, OpCode, Result]

### References

1. Fitness Machine Service (FTMS) Specification https://www.bluetooth.com/specifications/gatt/fitness-machine-service/

## Compatibility

Only tested in Chrome make sure to enable bluetooth.
Update firmware on KICKR to the latest version.

