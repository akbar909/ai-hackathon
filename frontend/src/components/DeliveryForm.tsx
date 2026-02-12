import { MapPin, Plus, Truck, X, Zap } from 'lucide-react';
import React, { useState } from 'react';
import type { DeliveryRequest, DeliveryStop, VehicleInfo } from '../types';

interface DeliveryFormProps {
    onSubmit: (request: DeliveryRequest) => void;
    isLoading: boolean;
}

const DeliveryForm: React.FC<DeliveryFormProps> = ({ onSubmit, isLoading }) => {
    const [startLocation, setStartLocation] = useState('Saddar, Hyderabad, Sindh, Pakistan');
    const [stops, setStops] = useState<DeliveryStop[]>([
        { address: 'Latifabad, Hyderabad, Sindh, Pakistan', priority: 1 },
    ]);
    const [vehicleType, setVehicleType] = useState('van');
    const [fuelEfficiency, setFuelEfficiency] = useState(22);
    const [avoidPeakHours, setAvoidPeakHours] = useState(true);
    const [prioritizeSafety, setPrioritizeSafety] = useState(false);

    const addStop = () => {
        setStops([...stops, { address: '', priority: 1 }]);
    };

    const removeStop = (index: number) => {
        if (stops.length > 1) {
            setStops(stops.filter((_, i) => i !== index));
        }
    };

    const updateStop = (index: number, address: string) => {
        const newStops = [...stops];
        newStops[index].address = address;
        setStops(newStops);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const vehicle: VehicleInfo = {
            vehicle_type: vehicleType,
            fuel_efficiency_mpg: fuelEfficiency,
        };

        const request: DeliveryRequest = {
            stops,
            vehicle,
            start_location: startLocation,
            avoid_peak_hours: avoidPeakHours,
            prioritize_safety: prioritizeSafety,
        };

        onSubmit(request);
    };

    return (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Delivery Configuration</h2>
            </div>

            {/* Start Location */}
            <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Starting Location (Depot)
                </label>
                <input
                    type="text"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className="input-field w-full"
                    placeholder="Enter starting address"
                    required
                />
            </div>

            {/* Delivery Stops */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Delivery Stops ({stops.length})</label>
                    <button
                        type="button"
                        onClick={addStop}
                        className="flex items-center gap-1 text-sm text-primary hover:text-blue-400 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Stop
                    </button>
                </div>
                <div className="space-y-2">
                    {stops.map((stop, index) => (
                        <div key={index} className="flex gap-2">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={stop.address}
                                    onChange={(e) => updateStop(index, e.target.value)}
                                    className="input-field w-full"
                                    placeholder={`Stop ${index + 1} address`}
                                    required
                                />
                            </div>
                            {stops.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeStop(index)}
                                    className="glass p-2 rounded-lg hover:bg-danger/20 transition-colors"
                                >
                                    <X className="w-5 h-5 text-danger" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Vehicle Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Vehicle Type</label>
                    <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        className="input-field w-full"
                    >
                        <option value="car">Car</option>
                        <option value="van">Van</option>
                        <option value="truck">Truck</option>
                        <option value="motorcycle">Motorcycle</option>
                        <option value="scooter">Scooter/Rickshaw</option>
                        <option value="mini-truck">Mini Truck</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Fuel Efficiency (MPG)
                    </label>
                    <input
                        type="number"
                        value={fuelEfficiency}
                        onChange={(e) => setFuelEfficiency(Number(e.target.value))}
                        className="input-field w-full"
                        min="10"
                        max="50"
                        required
                    />
                </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={avoidPeakHours}
                        onChange={(e) => setAvoidPeakHours(e.target.checked)}
                        className="w-5 h-5 rounded accent-primary"
                    />
                    <span className="text-sm">Avoid peak traffic hours</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={prioritizeSafety}
                        onChange={(e) => setPrioritizeSafety(e.target.checked)}
                        className="w-5 h-5 rounded accent-primary"
                    />
                    <span className="text-sm">Prioritize safer routes (may be longer)</span>
                </label>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <div className="spinner w-5 h-5 border-2"></div>
                        Optimizing Route...
                    </>
                ) : (
                    <>
                        <Zap className="w-5 h-5" />
                        Optimize Route
                    </>
                )}
            </button>
        </form>
    );
};

export default DeliveryForm;
