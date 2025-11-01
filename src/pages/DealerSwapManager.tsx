import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  addressToString,
  AddressInput,
  AddressData,
} from "@/components/ui/address-input";
import { getJobCoordinates } from "@/services/geoService";

export default function DealerSwapManager() {
  const [swaps, setSwaps] = useState<any[]>([]);
  const [stockNumber, setStockNumber] = useState("");
  const [fromDealer, setFromDealer] = useState("");
  const [toDealer, setToDealer] = useState("");
  const [pickupAddress, setPickupAddress] = useState<AddressData>({
    street: "",
    city: "",
    state: "",
    zip: "",
  });
  const [deliveryAddress, setDeliveryAddress] = useState<AddressData>({
    street: "",
    city: "",
    state: "",
    zip: "",
  });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchSwaps();
  }, []);

  async function fetchSwaps() {
    const { data, error } = await supabase
      .from("swaps")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setSwaps(data);
  }

  async function handleCreateSwap(e: React.FormEvent) {
    e.preventDefault();

    const coords = await getJobCoordinates(
      addressToString(pickupAddress),
      addressToString(deliveryAddress),
    );

    const { error } = await supabase.from("swaps").insert({
      stock_number: stockNumber,
      from_dealer: fromDealer,
      to_dealer: toDealer,
      pickup_address: addressToString(pickupAddress),
      delivery_address: addressToString(deliveryAddress),
      pickup_lat: coords?.pickup_lat,
      pickup_lng: coords?.pickup_lng,
      delivery_lat: coords?.delivery_lat,
      delivery_lng: coords?.delivery_lng,
      status: "pending",
      notes,
    });

    if (error) console.error("Error inserting swap:", error);
    else {
      setStockNumber("");
      setFromDealer("");
      setToDealer("");
      setPickupAddress({ street: "", city: "", state: "", zip: "" });
      setDeliveryAddress({ street: "", city: "", state: "", zip: "" });
      setNotes("");
      fetchSwaps();
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white">Inventory Swap Manager</h1>

      {/* Create Swap Form */}
      <form
        onSubmit={handleCreateSwap}
        className="space-y-4 bg-neutral-900 p-4 rounded-xl shadow-md"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white">Stock # / VIN</Label>
            <Input
              value={stockNumber}
              onChange={(e) => setStockNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="text-white">From Dealer</Label>
            <Input
              value={fromDealer}
              onChange={(e) => setFromDealer(e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="text-white">To Dealer</Label>
            <Input
              value={toDealer}
              onChange={(e) => setToDealer(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white">Pickup Address</Label>
            <AddressInput
              value={pickupAddress}
              onChange={setPickupAddress}
              label=""
            />
          </div>
          <div>
            <Label className="text-white">Delivery Address</Label>
            <AddressInput
              value={deliveryAddress}
              onChange={setDeliveryAddress}
              label=""
            />
          </div>
        </div>

        <div>
          <Label className="text-white">Notes / Reason</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why is this swap needed?"
          />
        </div>

        <Button
          type="submit"
          className="bg-[#E11900] hover:bg-[#E11900]/90 text-white font-bold px-6 py-3 rounded-lg"
        >
          Create Swap
        </Button>
      </form>

      {/* Swap List */}
      <div className="bg-neutral-900 p-4 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-white mb-3">Recent Swaps</h2>
        {swaps.length === 0 ? (
          <p className="text-gray-400">No swaps yet.</p>
        ) : (
          <ul className="space-y-2">
            {swaps.map((swap) => (
              <li
                key={swap.id}
                className="border border-neutral-700 p-3 rounded-lg text-white"
              >
                <strong>{swap.stock_number}</strong> — {swap.from_dealer} →{" "}
                {swap.to_dealer}
                <br />
                <span className="text-gray-400 text-sm">
                  Status: {swap.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
