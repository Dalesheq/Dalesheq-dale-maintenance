import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Plus,
  X,
  Check,
  Briefcase,
  Layers,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { storageService, CustomClient, CustomLocation } from '../services/storageService';

interface ClientLocationRegisterSelectorProps {
  currentClient: string;
  currentLocation: string;
  onClientChange: (clientName: string) => void;
  onLocationChange: (locationText: string, facilityName: string, address?: string) => void;
}

export const ClientLocationRegisterSelector: React.FC<ClientLocationRegisterSelectorProps> = ({
  currentClient,
  currentLocation,
  onClientChange,
  onLocationChange,
}) => {
  const [clients, setClients] = useState<string[]>(() => storageService.getClients());
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isNewLocationModalOpen, setIsNewLocationModalOpen] = useState(false);

  // New Client Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientContact, setNewClientContact] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // New Location Form State
  const [newFacilityName, setNewFacilityName] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLocationClient, setNewLocationClient] = useState(currentClient || 'General Client');

  // Refresh data on storage updates
  React.useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setClients(storageService.getClients());
    });
    return unsub;
  }, []);

  // Locations filtered by current client (if chosen)
  const clientLocations = useMemo(() => {
    return storageService.getLocations(currentClient);
  }, [currentClient]);

  // All locations (for fallback or cross-plant selection)
  const allLocations = useMemo(() => {
    return storageService.getLocations();
  }, []);

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const created = storageService.addCustomClient(newClientName.trim(), {
      contactPerson: newClientContact.trim(),
      contactNumber: newClientPhone.trim(),
    });

    setClients(storageService.getClients());
    onClientChange(created.name);
    setNewLocationClient(created.name);
    setIsNewClientModalOpen(false);
    setNewClientName('');
    setNewClientContact('');
    setNewClientPhone('');
  };

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacilityName.trim() || !newRegion.trim()) return;

    const targetClient = newLocationClient.trim() || currentClient || 'General Client';
    const created = storageService.addCustomLocation({
      clientName: targetClient,
      facilityName: newFacilityName.trim(),
      region: newRegion.trim(),
      address: newAddress.trim() || `${newFacilityName.trim()}, ${newRegion.trim()}`,
    });

    onLocationChange(
      `${created.facilityName}, ${created.region}`,
      created.facilityName,
      created.address
    );

    if (!currentClient || currentClient === 'General Client') {
      onClientChange(targetClient);
    }

    setIsNewLocationModalOpen(false);
    setNewFacilityName('');
    setNewRegion('');
    setNewAddress('');
  };

  return (
    <div className="space-y-3">
      {/* 1. Project / Client Dropdown Row */}
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:items-center">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5 text-red-600" />
          <span>Project / Client:</span>
        </label>

        <div className="sm:col-span-2 flex items-center gap-1.5">
          <div className="relative flex-1">
            <select
              value={currentClient || ''}
              onChange={(e) => {
                const val = e.target.value;
                onClientChange(val);
                setNewLocationClient(val);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-2.5 pr-8 text-xs font-semibold text-slate-900 focus:border-red-600 focus:outline-hidden shadow-2xs truncate"
            >
              <option value="">-- Select Allocated Client / Project --</option>
              {clients.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsNewClientModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 hover:border-red-300 transition-colors shadow-2xs shrink-0"
            title="Create a new client/project not in the list"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>New Client</span>
          </button>
        </div>
      </div>

      {/* 2. Plant / Site Location Dropdown Row */}
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:items-center">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-blue-600" />
          <span>Plant Location:</span>
        </label>

        <div className="sm:col-span-2 flex items-center gap-1.5">
          <div className="relative flex-1">
            <select
              value={currentLocation || ''}
              onChange={(e) => {
                const selectedText = e.target.value;
                const match = allLocations.find(
                  (l) => l.locationText === selectedText || l.facilityName === selectedText
                );
                if (match) {
                  onLocationChange(match.locationText, match.facilityName, match.address);
                  if (!currentClient || currentClient === 'General Client') {
                    onClientChange(match.clientName);
                  }
                } else {
                  onLocationChange(selectedText, selectedText);
                }
              }}
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-2.5 pr-8 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-hidden shadow-2xs truncate"
            >
              <option value="">-- Select Plant Location / Facility --</option>

              {/* Show locations for the selected client first */}
              {currentClient && clientLocations.length > 0 && (
                <optgroup label={`Facilities for ${currentClient} (${clientLocations.length})`}>
                  {clientLocations.map((loc) => (
                    <option key={`client-${loc.id}`} value={loc.locationText}>
                      {loc.facilityName} ({loc.region})
                    </option>
                  ))}
                </optgroup>
              )}

              {/* Show all other locations */}
              <optgroup label={`All Plant Facilities (${allLocations.length})`}>
                {allLocations.map((loc) => (
                  <option key={`all-${loc.id}`} value={loc.locationText}>
                    {loc.facilityName} &bull; {loc.clientName} ({loc.region})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setNewLocationClient(currentClient || clients[0] || 'General Client');
              setIsNewLocationModalOpen(true);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-2xs shrink-0"
            title="Create a new plant location not in the list"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>New Location</span>
          </button>
        </div>
      </div>

      {/* Active Allocation Confirmation Pill */}
      {currentClient && (
        <div className="flex items-center justify-between text-[11px] bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1 text-slate-600">
          <div className="truncate">
            Allocated Client: <strong className="text-slate-900">{currentClient}</strong>
            {currentLocation && (
              <> &bull; Facility: <span className="text-slate-800 font-medium">{currentLocation}</span></>
            )}
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded shrink-0">
            Allocated
          </span>
        </div>
      )}

      {/* Modal 1: Create New Client / Project */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white font-bold">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create New Project / Client</h3>
                  <p className="text-[11px] text-slate-500">Add to permanent client register</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Client / Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Infrabake Holdings / Premier Foods"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-red-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Contact Person (Optional)</label>
                <input
                  type="text"
                  value={newClientContact}
                  onChange={(e) => setNewClientContact(e.target.value)}
                  placeholder="e.g. Johan Venter (Plant Engineer)"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-red-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Phone / Emergency Contact (Optional)</label>
                <input
                  type="text"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="e.g. 011 462 0044"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-red-600 focus:outline-hidden"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>Save &amp; Allocate Client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create New Plant Location */}
      {isNewLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create New Plant Location</h3>
                  <p className="text-[11px] text-slate-500">Add to facility register</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewLocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Assign to Client / Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={newLocationClient}
                  onChange={(e) => setNewLocationClient(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-hidden"
                >
                  {clients.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Facility / Plant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newFacilityName}
                  onChange={(e) => setNewFacilityName(e.target.value)}
                  placeholder="e.g. Sasko Cape Town Plant 3"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800">
                  City / Region / Province <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  placeholder="e.g. Epping Industrial, Cape Town"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Street Address (Optional)</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. 14 Packer Ave, Epping 2, Cape Town"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewLocationModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>Save &amp; Set Location</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
