import { get } from 'svelte/store';
import { bluetoothDevice, bluetoothServer, controlPointCharacteristic, isConnected } from '../stores/ble';

export class BluetoothService {
    // Essential FTMS UUIDs
    private static FTMS_SERVICE_UUID = '00001826-0000-1000-8000-00805f9b34fb';
    private static INDOOR_BIKE_DATA_UUID = '00002ad2-0000-1000-8000-00805f9b34fb';
    private static CONTROL_POINT_UUID = '00002ad9-0000-1000-8000-00805f9b34fb';

    // Essential Control Point opcodes
    private static OPCODE_SET_TARGET_POWER = 0x05;
    private static OPCODE_REQUEST_CONTROL = 0x00;
    private static OPCODE_START = 0x07;
    private static OPCODE_STOP = 0x08;

    private indoorBikeDataChar: BluetoothRemoteGATTCharacteristic | null = null;
    private hasControl = false;

    async connect() {
        try {
            const device = await navigator.bluetooth.requestDevice({ 
                filters: [{ services: [BluetoothService.FTMS_SERVICE_UUID] }]
            });
            
            const server = await device.gatt?.connect();
            if (!device || !server) return false;

            bluetoothDevice.set(device);
            bluetoothServer.set(server);

            await this.setupFTMS(server);
            isConnected.set(true);
            return true;
        } catch (error) {
            console.error('Connection failed:', error);
            return false;
        }
    }

    private async setupFTMS(server: BluetoothRemoteGATTServer) {
        const service = await server.getPrimaryService(BluetoothService.FTMS_SERVICE_UUID);
        
        const controlPoint = await service.getCharacteristic(BluetoothService.CONTROL_POINT_UUID);
        await controlPoint.startNotifications();
        controlPointCharacteristic.set(controlPoint);

        this.indoorBikeDataChar = await service.getCharacteristic(BluetoothService.INDOOR_BIKE_DATA_UUID);
        await this.indoorBikeDataChar.startNotifications();
    }

    async requestControl(): Promise<boolean> {
        const char = get(controlPointCharacteristic);
        if (!char) return false;
        
        return new Promise((resolve) => {
            const handleResponse = (event: Event) => {
                const target = event.target as BluetoothRemoteGATTCharacteristic;
                if (!target.value) return;
                const data = new Uint8Array(target.value.buffer);
                
                if (data[0] === 0x80 && data[1] === BluetoothService.OPCODE_REQUEST_CONTROL) {
                    this.hasControl = data[2] === 0x01;
                    char.removeEventListener('characteristicvaluechanged', handleResponse);
                    resolve(this.hasControl);
                }
            };
            
            char.addEventListener('characteristicvaluechanged', handleResponse);
            const command = new Uint8Array([BluetoothService.OPCODE_REQUEST_CONTROL]);
            char.writeValue(command).catch(() => resolve(false));
        });
    }

    async startWorkout(): Promise<boolean> {
        const char = get(controlPointCharacteristic);
        if (!char || !this.hasControl) return false;

        try {
            const command = new Uint8Array([BluetoothService.OPCODE_START]);
            await char.writeValue(command);
            return true;
        } catch (e) {
            return false;
        }
    }

    async stopWorkout(): Promise<boolean> {
        const char = get(controlPointCharacteristic);
        if (!char || !this.hasControl) return false;

        try {
            const command = new Uint8Array([BluetoothService.OPCODE_STOP]);
            await char.writeValue(command);
            return true;
        } catch (e) {
            return false;
        }
    }

    async setTargetPower(watts: number): Promise<boolean> {
        const char = get(controlPointCharacteristic);
        if (!char || !this.hasControl) return false;

        try {
            const command = new Uint8Array([
                BluetoothService.OPCODE_SET_TARGET_POWER,
                watts & 0xFF,
                (watts >> 8) & 0xFF
            ]);
            await char.writeValue(command);
            return true;
        } catch (e) {
            return false;
        }
    }

    subscribeToIndoorBikeData(callback: (power: number) => void) {
        if (!this.indoorBikeDataChar) return () => {};

        const handler = (event: Event) => {
            const char = event.target as BluetoothRemoteGATTCharacteristic;
            if (!char.value) return;

            const data = new Uint8Array(char.value.buffer);
            const flags = data[0] | (data[1] << 8);
            
            let index = 2;
            let power = 0;

            if (flags & 0x04) { // Speed present
                index += 2;
            }

            if (flags & 0x40) { // Power present
                power = data[index] | (data[index + 1] << 8);
            }

            callback(power);
        };

        this.indoorBikeDataChar.addEventListener('characteristicvaluechanged', handler);
        return () => {
            this.indoorBikeDataChar?.removeEventListener('characteristicvaluechanged', handler);
        };
    }

    cleanup() {
        if (this.indoorBikeDataChar) {
            this.indoorBikeDataChar.stopNotifications().catch(console.error);
        }
    }
} 