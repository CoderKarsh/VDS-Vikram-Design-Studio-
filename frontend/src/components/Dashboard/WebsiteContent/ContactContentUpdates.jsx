import React, { useState } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";

const initialContacts = [
  { 
    id: 1,
    city: "Guwahati",
    phone_numbers: ["+91 70990 50180", "+91 97060 77180"],
    address: "Aastha Plaza, B2, 2nd Floor, Bora Service, opp. to SB Deorah College, Guwahati, Assam 781007",
    google_maps_iframe_src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3580.8615137856277!2d91.76120077555963!3d26.168639277098546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x375a59536d34694d%3A0x5dd7c3fa56503ad1!2sVikram%20Design%20Studio!5e0!3m2!1sen!2sin!4v1757089159991!5m2!1sen!2sin"
  },
  { 
    id: 2,
    city: "Kolkata",
    phone_numbers: ["+91 70990 50180", "+91 97060 77180"],
    address: "12th Floor, Unit 12W2, Mani Casadona, Action Area I, IIF, Newtown, Kolkata, West Bengal 700156",
    google_maps_iframe_src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3683.829030314799!2d88.48329621064381!3d22.585496932412404!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a020b3afc09b2fd%3A0xc49d34fd7a2d99f3!2sVikram%20Design%20Studio%20-%20Architecture%20%7C%20Interior%20%7C%20Landscape!5e0!3m2!1sen!2sin!4v1757093764341!5m2!1sen!2sin"
  }
];

const ContactContentUpdates = () => {
  const [contacts, setContacts] = useState(initialContacts);
  const [editingId, setEditingId] = useState(null);
  const [newContact, setNewContact] = useState({
    city: "",
    phone_numbers: [""],
    address: "",
    google_maps_iframe_src: "",
  });

  const handleSave = () => {
    if (!newContact.city || !newContact.address) return;

    if (editingId) {
      setContacts((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...newContact } : c))
      );
      setEditingId(null);
    } else {
      const id = Math.max(0, ...contacts.map((c) => c.id)) + 1;
      setContacts([...contacts, { id, ...newContact }]);
    }

    setNewContact({ city: "", phone_numbers: [""], address: "", google_maps_iframe_src: "" });
  };

  const handleEdit = (contact) => {
    setEditingId(contact.id);
    setNewContact({ ...contact });
  };

  const handleDelete = (id) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handlePhoneChange = (index, value) => {
    const updatedPhones = [...newContact.phone_numbers];
    updatedPhones[index] = value;
    setNewContact((prev) => ({ ...prev, phone_numbers: updatedPhones }));
  };

  const addPhoneNumber = () => {
    setNewContact((prev) => ({ ...prev, phone_numbers: [...prev.phone_numbers, ""] }));
  };

  const removePhoneNumber = (index) => {
    setNewContact((prev) => ({
      ...prev,
      phone_numbers: prev.phone_numbers.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="p-6 bg-white text-[#454545] space-y-6">
      <h2 className="text-2xl font-bold">Contact Page Updates</h2>

      {/* Add / Edit Form */}
      <div className="space-y-4 border-b border-gray-300 pb-4">
        <input
          type="text"
          placeholder="City"
          value={newContact.city}
          onChange={(e) => setNewContact((prev) => ({ ...prev, city: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />

        <div className="space-y-2">
          <label className="font-medium">Phone Numbers</label>
          {newContact.phone_numbers.map((num, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={num}
                onChange={(e) => handlePhoneChange(idx, e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2"
              />
              <button
                onClick={() => removePhoneNumber(idx)}
                className="px-2 py-1 bg-gray-300 text-[#454545] rounded hover:bg-gray-400"
              >
                X
              </button>
            </div>
          ))}
          <button
            onClick={addPhoneNumber}
            className="px-4 py-2 bg-gray-400 text-[#454545] rounded hover:bg-gray-500 flex items-center gap-2"
          >
            <Plus size={16} /> Add Phone
          </button>
        </div>

        <textarea
          placeholder="Address"
          value={newContact.address}
          onChange={(e) => setNewContact((prev) => ({ ...prev, address: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-2 h-24 resize-none"
        />
        <textarea
          placeholder="Google Maps Iframe Src"
          value={newContact.google_maps_iframe_src}
          onChange={(e) =>
            setNewContact((prev) => ({ ...prev, google_maps_iframe_src: e.target.value }))
          }
          className="w-full border border-gray-300 rounded px-3 py-2 h-24 resize-none"
        />

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gray-400 text-[#454545] rounded hover:bg-gray-500 flex items-center gap-2"
          >
            <Plus size={16} /> {editingId ? "Update Contact" : "Add Contact"}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setNewContact({ city: "", phone_numbers: [""], address: "", google_maps_iframe_src: "" });
              }}
              className="px-4 py-2 bg-gray-300 text-[#454545] rounded hover:bg-gray-400 flex items-center gap-2"
            >
              <X size={16} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Existing Contacts */}
      <div className="space-y-4">
        {contacts.map((c) => (
          <div key={c.id} className="border border-gray-300 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">{c.city}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(c)}
                  className="px-2 py-1 bg-gray-300 text-[#454545] rounded hover:bg-gray-400"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="px-2 py-1 bg-gray-300 text-[#454545] rounded hover:bg-gray-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="mt-2">
              <p className="font-medium">Phone Numbers:</p>
              <ul className="list-disc list-inside">
                {c.phone_numbers.map((num, i) => (
                  <li key={i}>{num}</li>
                ))}
              </ul>
              <p className="mt-1 font-medium">Address:</p>
              <p>{c.address}</p>
              <p className="mt-1 font-medium">Google Maps:</p>
              <iframe
                src={c.google_maps_iframe_src}
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={c.city}
              ></iframe>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactContentUpdates;
