import { writable } from 'svelte/store';

// We store the references we need
export const bluetoothDevice = writable<BluetoothDevice | null>(null);
export const bluetoothServer = writable<BluetoothRemoteGATTServer | null>(null);
export const controlPointCharacteristic = writable<BluetoothRemoteGATTCharacteristic | null>(null);
export const fitnessMachineStatusCharacteristic = writable<BluetoothRemoteGATTCharacteristic | null>(null);
export const isConnected = writable<boolean>(false);
