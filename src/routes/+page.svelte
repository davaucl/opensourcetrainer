<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { isConnected } from '../lib/stores/ble';
    import { BluetoothService } from '../lib/services/bluetooth';
    import { PowerController } from '../lib/services/power';

    let bluetoothService: BluetoothService;
    let powerController: PowerController;
    let currentPower = 0;
    let targetPower = 150;
    let hasControl = false;
    let isStarted = false;
    let unsubscribeFromBikeData: (() => void) | undefined;

    onMount(() => {
        bluetoothService = new BluetoothService();
        powerController = new PowerController(bluetoothService);
    });

    onDestroy(() => {
        unsubscribeFromBikeData?.();
        bluetoothService?.cleanup();
    });

    async function connectToKickr() {
        const connected = await bluetoothService.connect();
        if (connected) {
            unsubscribeFromBikeData = bluetoothService.subscribeToIndoorBikeData((power) => {
                currentPower = power;
                if (isStarted) {
                    void powerController.handlePowerData(power);
                }
            });
        }
    }

    async function requestControl() {
        hasControl = await bluetoothService.requestControl();
    }

    async function startWorkout() {
        isStarted = await bluetoothService.startWorkout();
    }

    async function stopWorkout() {
        const stopped = await bluetoothService.stopWorkout();
        if (stopped) {
            isStarted = false;
        }
    }

    async function setTargetPower() {
        if (!hasControl || !isStarted) return;
        await powerController.setTarget(targetPower);
    }
</script>

<h1>KICKR Configuration</h1>

<div class="connection">
    <h2>Connection Status</h2>
    {#if $isConnected}
        <p class="status connected">Connected to KICKR</p>
        {#if !hasControl}
            <button on:click={requestControl}>Request Control</button>
        {:else}
            <p class="status">Has Control</p>
        {/if}
    {:else}
        <p class="status disconnected">Not Connected</p>
        <button on:click={connectToKickr}>Connect to KICKR</button>
    {/if}
</div>

<div class="power-control" class:disabled={!hasControl}>
    <h2>Power Control</h2>
    <div class="workout-controls">
        {#if !isStarted}
            <button on:click={startWorkout} disabled={!hasControl}>Start Workout</button>
        {:else}
            <button on:click={stopWorkout}>Stop Workout</button>
        {/if}
    </div>
    <div class="power-display">
        <h3>Power Output</h3>
        <p>Current: {currentPower}W</p>
        <p>Target: {targetPower}W</p>
        <p>Difference: {currentPower - targetPower}W</p>
        <div class="power-status">
            {#if Math.abs(currentPower - targetPower) < 10}
                <p class="success">✓ On Target</p>
            {:else if currentPower < targetPower * 0.8}
                <p class="warning">↑ Pedal Faster or Increase Resistance</p>
            {:else if currentPower > targetPower * 1.2}
                <p class="warning">↓ Reduce Effort</p>
            {/if}
        </div>
    </div>
    
    <div class="power-input">
        <label for="target-power">Set Target Power (W):</label>
        <input 
            id="target-power"
            type="number" 
            bind:value={targetPower}
            min="0"
            max="2000"
            disabled={!hasControl || !isStarted}
        />
        <button 
            on:click={setTargetPower} 
            disabled={!hasControl || !isStarted}
        >
            Set Power
        </button>
    </div>
</div>

<style>
    .connection, .power-control {
        margin: 2rem 0;
        padding: 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
    }
    
    .status {
        font-weight: bold;
    }
    
    .connected {
        color: green;
    }
    
    .disconnected {
        color: red;
    }
    
    .power-control.disabled {
        opacity: 0.5;
    }
    
    .power-display {
        margin: 1rem 0;
    }
    
    .power-input {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
    
    input[type="number"] {
        width: 100px;
    }
    
    .power-status {
        margin-top: 1rem;
        padding: 0.5rem;
        border-radius: 4px;
        background: var(--background-alt);
    }
    .success {
        color: var(--primary);
        font-weight: 500;
    }
    .warning {
        color: var(--warning);
        font-weight: 500;
    }
</style> 