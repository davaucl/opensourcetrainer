import type { BluetoothService } from './bluetooth';

export class PowerController {
    private currentTarget: number = 0;
    private actualTarget: number = 0;
    private lastUpdateTime: number = 0;

    constructor(
        private readonly bluetoothService: BluetoothService
    ) {
        this.lastUpdateTime = Date.now();
    }

    async setTarget(targetWatts: number) {
        this.currentTarget = targetWatts;
        await this.updatePower();
    }

    async handlePowerData(currentPower: number) {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;

        // Only check if power is too low
        if (currentPower < this.currentTarget * 0.6) {
            // Reduce power to help recovery
            this.actualTarget = this.currentTarget * 0.7;
            await this.updatePower();
            return;
        }

        // Gradually ramp power back to target
        if (this.actualTarget < this.currentTarget) {
            const rampAmount = 50 * deltaTime; // 50 watts per second
            this.actualTarget = Math.min(
                this.currentTarget,
                this.actualTarget + rampAmount
            );
            await this.updatePower();
        }
    }

    private async updatePower() {
        await this.bluetoothService.setTargetPower(Math.round(this.actualTarget));
    }
}