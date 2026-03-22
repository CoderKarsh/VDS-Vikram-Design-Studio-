import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaGripVertical, FaTrash } from "react-icons/fa";
import { FiUpload } from "react-icons/fi";
import { useParams, useNavigate } from "react-router-dom";
import projectApi from "../../../services/projectApi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// ⭐️ IMPORTED CONSTANTS
import {
  MAX_TEXT_LENGTH,
  PROJECT_LEADERS_OPTIONS,
  filterOptions,
  TAG_OPTIONS,
  STATES_AND_UTS,
} from "./constants";

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    year: "",
    status: "",
    category: "",
    subCategory: "",
    client: "",
    collaborators: "",
    projectLeaders: [],
    projectTeam: "",
    tags: [],
    keyDate: "",
    previewImageUrl: "",
    sizeM2FT2: "",
    // State keys match input names: 'lat' and 'lng'
    lat: "",
    lng: "",
  });

  const [nextNewSectionId, setNextNewSectionId] = useState(0);
  const [sections, setSections] = useState([]);
  const [previewURL, setPreviewURL] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [showLeaderDropdown, setShowLeaderDropdown] = useState(false);

  // State for Tag Input to match AddProject.jsx
  const [tagInput, setTagInput] = useState("");
  const [savedTags, setSavedTags] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch project data & saved tags
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const project = await projectApi.getProjectById(id);

        setFormData({
          name: project.name || "",
          location: project.location || "",
          year: project.year ? project.year.toString() : "",

          status: project.status ? project.status.toUpperCase() : "",
          category: project.category || "",
          subCategory: project.subCategory || "",
          client: project.client || "",
          collaborators: project.collaborators || "",
          projectLeaders: project.projectLeaders || [],
          projectTeam: project.projectTeam || "",
          tags: project.tags || [],
          // Ensure date format for input type="date"
          keyDate: project.keyDate
            ? new Date(project.keyDate).toISOString().slice(0, 10)
            : "",
          previewImageUrl: project.previewImageUrl || "",
          sizeM2FT2: project.sizeM2FT2 || "",
          // ⭐️ READ FIX: Reads 'latitude' and 'longitude' from the backend payload
          // and maps them to the local state keys 'lat' and 'lng'.
          lat:
            project.latitude !== undefined && project.latitude !== null
              ? String(project.latitude)
              : "",
          lng:
            project.longitude !== undefined && project.longitude !== null
              ? String(project.longitude)
              : "",
        });

        setSelectedCategory(project.category || "");
        setAvailableSubCategories(filterOptions[project.category] || []);

        const sectionsWithKeys = (project.sections || []).map(
          (section, index) => ({
            ...section,
            // Using existing `content` or a placeholder ID to ensure uniqueness
            tempId: `fetched-${index}-${Date.now() + index}`,
          })
        );

        setSections(sectionsWithKeys);
        setPreviewURL(project.previewImageUrl || null);
      } catch {
        toast.error("Failed to fetch project details.", { autoClose: 3000 });
      }
    };

    // Fetch previously saved tags from backend
    const fetchSavedTags = async () => {
      try {
        const projects = await projectApi.getProjects();
        const tags = new Set();
        projects.forEach((p) =>
          (p.tags || []).forEach((tag) => tags.add(tag.toUpperCase()))
        );
        setSavedTags(Array.from(tags));
      } catch {
        // Fallback for demonstration if API fails:
        setSavedTags([
          "SUSTAINABLE",
          "GREEN_BUILDING",
          "LOW_COST",
          "MODULAR_DESIGN",
          "HERITAGE_PRESERVATION",
        ]);
      }
    };

    fetchProject();
    fetchSavedTags();
  }, [id]);

  const handleCategoryChange = (e) => {
    const category = e.target.value.toUpperCase();
    setSelectedCategory(category);
    setAvailableSubCategories(filterOptions[category] || []);
    setFormData((prev) => ({ ...prev, category, subCategory: "" }));
  };

  const handleSubCategoryChange = (e) => {
    const subCategory = e.target.value.toUpperCase();
    setFormData((prev) => ({ ...prev, subCategory }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "year") {
      // Only allow numeric input
      const numericValue = value.replace(/\D/g, "");
      setFormData((prev) => ({
        ...prev,
        year: numericValue,
      }));
      return;
    }

    // Handle lat and lng as numbers/strings, not uppercase
    if (name === "lat" || name === "lng") {
      setFormData((prev) => ({
        ...prev,
        [name]: value, // Keep value as is (allows decimals/negative signs)
      }));
      return;
    }

    const upperCaseFields = [
      "name",
      "client",
      "projectTeam",
      "collaborators",
      "location",
      "status",
      "subCategory",
    ];

    setFormData((prev) => ({
      ...prev,
      [name]: upperCaseFields.includes(name) ? value.toUpperCase() : value,
    }));
  };

  const handleLeaderToggle = (leader) => {
    setFormData((prev) => {
      const leaders = prev.projectLeaders;
      if (leaders.includes(leader)) {
        return { ...prev, projectLeaders: leaders.filter((l) => l !== leader) };
      } else {
        return { ...prev, projectLeaders: [...leaders, leader] };
      }
    });
  };

  // Updated to match AddProject's tag logic (input + dropdown)
  const handleAddTag = (tag = null) => {
    const newTag = (tag || tagInput).trim().toUpperCase();
    if (!newTag || formData.tags.includes(newTag)) return;

    setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag] }));

    if (!savedTags.includes(newTag)) {
      setSavedTags((prev) => [...prev, newTag]);
    }

    setTagInput("");
    setShowDropdown(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleAddText = () => {
    setSections((prev) => [
      ...prev,
      { type: "text", content: "", tempId: `new-${nextNewSectionId}` },
    ]);
    setNextNewSectionId((prev) => prev + 1);
  };

  const handleAddVideoLink = () => {
    setSections((prev) => [
      ...prev,
      { type: "video", content: "", tempId: `new-${nextNewSectionId}` },
    ]);
    setNextNewSectionId((prev) => prev + 1);
  };

  // Functionality for Media upload (kept from original EditProject)
  const uploadFileToBackend = async (file) => {
    if (!file) return null;
    try {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    } catch {
      toast.error(
        "File upload failed. Please check the file size (max 900KB)."
      );
      return null;
    }
  };

  const handleAddMedia = async (file, type) => {
    if (!file || file.size > 900 * 1024) {
      // 900KB limit
      toast.error("File is too large! Max size is 900KB.");
      return;
    }

    const tempId = `new-${nextNewSectionId}`;
    setNextNewSectionId((prev) => prev + 1);

    // Create a temporary section for immediate display
    const localUrl = URL.createObjectURL(file);
    const tempSection = { type, content: localUrl, tempId: tempId };

    setSections((prev) => [...prev, tempSection]);

    const uploadedUrl = await uploadFileToBackend(file);

    if (uploadedUrl) {
      // Replace local URL with permanent URL from the backend
      setSections((prev) =>
        prev.map((s) =>
          s.tempId === tempId
            ? { type, content: uploadedUrl, tempId: tempId }
            : s
        )
      );
      // Clean up local URL
      URL.revokeObjectURL(localUrl);
    } else {
      // If upload failed, remove the temporary section
      setSections((prev) => prev.filter((s) => s.tempId !== tempId));
      URL.revokeObjectURL(localUrl);
    }
  };

  // Simplified handlers to use the combined function
  const handleAddImage = (e) => handleAddMedia(e.target.files[0], "image");
  const handleAddGif = (e) => handleAddMedia(e.target.files[0], "gif");

  const handleContentChange = (index, value) => {
    if (value.length > MAX_TEXT_LENGTH) return;
    setSections((prev) => {
      const newSections = [...prev];
      newSections[index].content = value;
      return newSections;
    });
  };

  const handleRemoveContent = (index) =>
    setSections((prev) => prev.filter((_, i) => i !== index));

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(sections);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setSections(reordered);
  };

  const handlePreviewChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 900 * 1024) {
      // 900KB limit
      toast.error("Preview file is too large! Max size is 900KB.");
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewURL(localUrl);

    const uploadedUrl = await uploadFileToBackend(file);
    if (!uploadedUrl) {
      setPreviewURL(formData.previewImageUrl || null); // revert to original or null
      return;
    }

    setFormData((prev) => ({ ...prev, previewImageUrl: uploadedUrl }));
    setPreviewURL(uploadedUrl); // Update preview to permanent URL if needed for state consistency
    URL.revokeObjectURL(localUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error("Project name is required.");
      return;
    }

    const cleanSections = sections.map(({ type, content }) => ({
      type,
      content,
    }));

    const data = {
      ...formData,
      name: trimmedName,
      sections: cleanSections,
      // WRITE FIX: Send 'lat' and 'lng' to the controller, which maps them to 'latitude'/'longitude'
      lat: formData.lat !== "" ? parseFloat(formData.lat) : null,
      lng: formData.lng !== "" ? parseFloat(formData.lng) : null,
    };

    // Optional basic validation for coordinates
    if (data.lat !== null && (data.lat < -90 || data.lat > 90)) {
      toast.error("Latitude must be between -90 and 90.");
      return;
    }
    if (data.lng !== null && (data.lng < -180 || data.lng > 180)) {
      toast.error("Longitude must be between -180 and 180.");
      return;
    }

    try {
      toast.info("Updating project...")
      await projectApi.updateProject(id, data);
      toast.success("Project updated successfully! 🎉", {
        position: "top-center",
        autoClose: 2000,
        onClose: () => navigate("/admin/dashboard/projects"),
      });
    } catch (err) {
      // console.error(err);
      const errorMessage =
        err?.response?.data?.message ||
        "Failed to update project. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex-1 p-6 bg-[#F5F1EE]">
      <nav className="text-sm font-medium mb-4 text-[#722F37]">
        <span>Projects</span> &gt; <span>Edit Project</span>
      </nav>

      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded p-6 flex flex-col gap-6"
      >
        <div className="grid grid-cols-2 gap-6 items-start">
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-lg text-[#454545]">
              1. Mandatory Fields
            </h2>
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

            {/* Latitude and Longitude Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                name="lat"
                value={formData.lat}
                onChange={handleChange}
                placeholder="Latitude (e.g., 23.82)"
                className="border p-2 rounded w-full border-[#C9BEB8]"
                step="any"
                min="-90"
                max="90"
                autoComplete="off"
              />
              <input
                type="number"
                name="lng"
                value={formData.lng}
                onChange={handleChange}
                placeholder="Longitude (e.g., 91.27)"
                className="border p-2 rounded w-full border-[#C9BEB8]"
                step="any"
                min="-180"
                max="180"
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
                onChange={handleSubCategoryChange} // ✅ use separate handler
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
              name="sizeM2FT2"
              value={formData.sizeM2FT2}
              onChange={handleChange}
              placeholder="Size (M2/FT2)"
              className="border p-2 rounded w-full border-[#C9BEB8]"
              autoComplete="off"
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
            {/* Project Leader Dropdown */}
            <div className="relative">
              <div
                className="border p-2 rounded w-full border-[#C9BEB8] cursor-pointer bg-white"
                onClick={() => setShowLeaderDropdown(!showLeaderDropdown)}
              >
                {formData.projectLeaders.length > 0
                  ? formData.projectLeaders.join(", ")
                  : "Select Project Leader(s) *"}
              </div>
              {showLeaderDropdown && (
                <div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto">
                  {PROJECT_LEADERS_OPTIONS.map((leader) => (
                    <div
                      key={leader}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleLeaderToggle(leader);
                      }}
                      className={`p-2 cursor-pointer text-sm flex justify-between items-center ${
                        formData.projectLeaders.includes(leader)
                          ? "bg-[#F1E4DF] font-semibold"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {leader}
                      {formData.projectLeaders.includes(leader) && (
                        <span className="text-[#722F37] text-xl">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <input
                type="hidden"
                name="projectLeaders"
                value={formData.projectLeaders.join(",")}
                required={formData.projectLeaders.length === 0}
              />
            </div>

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
            <div className="grid grid-cols-2 gap-2">
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="border p-2 rounded w-full border-[#C9BEB8]"
                required
              >
                <option value="">SELECT STATUS *</option>
                {/* Placeholder option */}
                <option value="ON-SITE">ON-SITE</option>
                <option value="DESIGN STAGE">DESIGN STAGE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="UNBUILT">UNBUILT</option>
              </select>

              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="Year *"
                className="border p-2 rounded w-full border-[#C9BEB8]"
                required
              />
            </div>
          </div>

          {/* Preview Upload - Aligned Style */}
          <div className="flex flex-col gap-2 items-center justify-center border p-4 rounded border-[#C9BEB8]">
            <p className="text-xs text-gray-400 mb-2 text-center">
              ⚠️ Files must not be greater than 900 KB.
            </p>
            <label
              htmlFor="preview-upload"
              className="flex items-center gap-2 px-4 py-2 bg-[#722F37] text-white rounded-md cursor-pointer hover:bg-[#632932] transition"
            >
              <FiUpload />
              <span className="text-sm font-medium">Upload Preview</span>
              <input
                id="preview-upload"
                type="file"
                accept="image/*,.gif"
                onChange={handlePreviewChange}
                className="hidden"
              />
            </label>
            {previewURL && (
              <img
                src={previewURL}
                alt="Preview"
                className="w-auto h-68 object-cover rounded mt-2"
              />
            )}
          </div>
        </div>

        {/* Tags Input and Dropdown (Aligned with AddProject) */}
        <div>
          <h2 className="font-bold text-lg mb-2 text-[#454545]">
            2. Project Tags
          </h2>
          <div className="relative">
            {/* Input for adding new tags */}
            <div className="flex border rounded border-[#C9BEB8] overflow-hidden">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setShowDropdown(false), 200);
                }}
                placeholder="Add tags..."
                className="p-2 flex-grow focus:outline-none"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="px-4 py-2 bg-[#722F37] text-white hover:bg-[#632932] text-sm font-medium"
              >
                Add
              </button>
            </div>

            {/* Dropdown for suggested tags */}
            {showDropdown && tagInput.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-t-0 rounded-b shadow-lg max-h-60 overflow-y-auto">
                {savedTags
                  .filter(
                    (tag) =>
                      tag.includes(tagInput.toUpperCase()) &&
                      !formData.tags.includes(tag)
                  )
                  .sort()
                  .slice(0, 10)
                  .map((tag) => (
                    <div
                      key={tag}
                      onMouseDown={() => {
                        handleAddTag(tag);
                        setTagInput("");
                        setShowDropdown(false);
                      }}
                      className="p-2 cursor-pointer hover:bg-gray-100 text-sm"
                    >
                      {tag}
                    </div>
                  ))}
              </div>
            )}

            {/* Display selected tags - Aligned Style */}
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 bg-[#F1E4DF] text-[#722F37] text-xs font-medium px-3 py-1 rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-[#722F37] hover:text-[#5B252C]"
                    aria-label={`Remove tag ${tag}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Key Date - Read-Only and Styled */}
        <div>
          <label
            htmlFor="keyDate"
            className="block text-sm font-medium text-[#454545] mb-1"
          >
            Key Date
          </label>
          <input
            id="keyDate"
            type="date"
            name="keyDate"
            value={formData.keyDate}
            readOnly
            className="border p-2 rounded w-full border-[#C9BEB8] bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Sections - Aligned Style and Warning */}
        <div className="mt-6">
          <h2 className="font-bold text-lg mb-4 text-[#454545]">
            3. Content Sections (Files must not be greater than 900kb)
          </h2>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {sections.map((section, index) => (
                    <Draggable
                      key={section.tempId}
                      draggableId={section.tempId}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          className="mb-4 border rounded p-4 border-[#C9BEB8] bg-white flex flex-col gap-2"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-[#454545]">
                              {`${
                                section.type.charAt(0).toUpperCase() +
                                section.type.slice(1)
                              } Section`}
                            </h3>
                            <div className="flex gap-2 items-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveContent(index)}
                                className="text-[#C94A4A] hover:text-red-700"
                              >
                                <FaTrash />
                              </button>
                              <span
                                {...provided.dragHandleProps}
                                className="cursor-move text-gray-400"
                              >
                                <FaGripVertical />
                              </span>
                            </div>
                          </div>
                          {section.type === "text" ? (
                            <>
                              <textarea
                                className="border p-2 rounded w-full border-[#C9BEB8] min-h-[100px]"
                                value={section.content}
                                placeholder="Enter text"
                                onChange={(e) =>
                                  handleContentChange(index, e.target.value)
                                }
                                maxLength={MAX_TEXT_LENGTH}
                              />
                              <div className="text-right text-xs text-gray-500">
                                {section.content.length} / {MAX_TEXT_LENGTH}
                              </div>
                            </>
                          ) : section.type === "video" ? (
                            <input
                              type="text"
                              className="border p-2 rounded w-full border-[#C9BEB8]"
                              value={section.content}
                              placeholder="Enter video URL (YouTube link)"
                              onChange={(e) =>
                                handleContentChange(index, e.target.value)
                              }
                            />
                          ) : (
                            <div className="flex justify-center w-full">
                              <img
                                src={section.content}
                                alt={`${section.type} content`}
                                className="max-h-40 rounded object-cover"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Aligned Action Buttons */}
          <div className="flex gap-2 mt-4 justify-start">
            <button
              type="button"
              onClick={handleAddText}
              className="px-4 py-2 text-sm rounded bg-[#454545] text-white hover:bg-[#666666]"
            >
              + Add Text
            </button>
            <label className="px-4 py-2 text-sm rounded bg-[#454545] text-white cursor-pointer hover:bg-[#666666]">
              + Add Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAddImage}
              />
            </label>
            <label className="px-4 py-2 text-sm rounded bg-[#454545] text-white cursor-pointer hover:bg-[#666666]">
              + Add GIF
              <input
                type="file"
                accept=".gif,image/gif"
                className="hidden"
                onChange={handleAddGif}
              />
            </label>
            <button
              type="button"
              onClick={handleAddVideoLink}
              className="px-4 py-2 text-sm rounded bg-[#454545] text-white hover:bg-[#666666]"
            >
              + Add Video Link
            </button>
          </div>
        </div>

        {/* Submit Button - Aligned Style */}
        <button
          type="submit"
          className="mt-6 px-6 py-2 bg-[#722F37] text-white rounded hover:bg-[#632932] transition"
        >
          Update Project
        </button>
      </form>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default EditProject;
