import React from "react";
import LeaderDropdown from "./LeaderDropdown";
import { TAG_OPTIONS, STATES_AND_UTS, PROJECT_STATUS_OPTIONS } from "../constants";

const MandatoryFields = ({
  formData,
  handleChange,
  handleCategoryChange,
  selectedCategory,
  availableSubCategories,
  handleLeaderToggle,
  showLeaderDropdown,
  setShowLeaderDropdown,
  PROJECT_LEADERS_OPTIONS,
}) => (
  <div className="flex flex-col gap-4">
    <h2 className="font-bold text-lg text-[#454545]">1. Mandatory Fields</h2>

    <input
      type="text"
      name="name"
      value={formData.name}
      onChange={handleChange}
      placeholder="Project Name *"
      className="border p-2 rounded w-full border-[#C9BEB8]"
      autoComplete="off"
      required
    />

    <select
      name="location"
      value={formData.location}
      onChange={handleChange}
      className="border p-2 rounded w-full border-[#C9BEB8]"
      required
    >
      <option value="">Select State/UT *</option>
      {STATES_AND_UTS.map((state) => (
        <option key={state} value={state}>
          {state}
        </option>
      ))}
    </select>

    {/* Year and Status Fields */}
    <div className="grid grid-cols-2 gap-2">
      <input
        type="number"
        name="year"
        value={formData.year}
        onChange={handleChange}
        placeholder="Year"
        className="border p-2 rounded w-full border-[#C9BEB8]"
        required
      />

      <select
        name="status"
        value={formData.status}
        onChange={handleChange}
        className="border p-2 rounded w-full border-[#C9BEB8]"
      >
        <option value="">SELECT STATUS *</option>
        {PROJECT_STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>

    {/* Size Field */}
    <input
      type="text"
      name="sizeM2FT2"
      value={formData.sizeM2FT2}
      onChange={handleChange}
      placeholder="Size (M2/FT2)"
      className="border p-2 rounded w-full border-[#C9BEB8]"
      autoComplete="off"
    />

    {/* Latitude and Longitude Fields */}
    <div className="grid grid-cols-2 gap-2">
      <input
        type="number"
        name="lat"
        value={formData.lat}
        onChange={handleChange}
        placeholder="Latitude (e.g., 23.82)"
        step="any"
        min="-90"
        max="90"
        className="border p-2 rounded w-full border-[#C9BEB8]"
        autoComplete="off"
      />

      <input
        type="number"
        name="lng"
        value={formData.lng}
        onChange={handleChange}
        placeholder="Longitude (e.g., 91.27)"
        step="any"
        min="-180"
        max="180"
        className="border p-2 rounded w-full border-[#C9BEB8]"
        autoComplete="off"
      />
    </div>

    <div className="grid grid-cols-2 gap-2">
      <select
        name="category"
        value={selectedCategory}
        onChange={handleCategoryChange}
        className="border p-2 rounded w-full border-[#C9BEB8]"
        required
      >
        <option value="">Select Category *</option>
        {TAG_OPTIONS.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <select
        name="subCategory"
        value={formData.subCategory}
        onChange={handleChange}
        className="border p-2 rounded w-full border-[#C9BEB8]"
        disabled={!availableSubCategories.length}
      >
        <option value="">Select Sub-Category</option>
        {availableSubCategories.map((sub) => (
          <option key={sub} value={sub}>
            {sub}
          </option>
        ))}
      </select>
    </div>

    <input
      type="text"
      name="client"
      value={formData.client}
      onChange={handleChange}
      placeholder="Client *"
      className="border p-2 rounded w-full border-[#C9BEB8]"
      autoComplete="off"
      required
    />

    <input
      type="text"
      name="collaborators"
      value={formData.collaborators}
      onChange={handleChange}
      placeholder="Collaborators *"
      className="border p-2 rounded w-full border-[#C9BEB8]"
      autoComplete="off"
      required
    />

    <LeaderDropdown
      options={PROJECT_LEADERS_OPTIONS}
      selected={formData.projectLeaders}
      onToggle={handleLeaderToggle}
      show={showLeaderDropdown}
      setShow={setShowLeaderDropdown}
    />

    <input
      type="text"
      name="projectTeam"
      value={formData.projectTeam}
      onChange={handleChange}
      placeholder="Project Team *"
      className="border p-2 rounded w-full border-[#C9BEB8]"
      autoComplete="off"
      required
    />
  </div>
);

export default MandatoryFields;
