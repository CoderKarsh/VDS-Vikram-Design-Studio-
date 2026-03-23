// src/pages/Projects/AddProject/AddProject.jsx
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaGripVertical, FaTrash } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import projectApi from "../../../services/projectApi";
import { PROJECT_LEADERS_OPTIONS, filterOptions, MAX_TEXT_LENGTH } from "./constants";
import MandatoryFields from "./components/MandatoryFields";
import PreviewUploader from "./components/PreviewUploader";
import ProjectTags from "./components/ProjectTags";

const MAX_PREVIEW_SIZE_BYTES = 900 * 1024; // 900 KB

const AddProject = () => {
  // ---- Section ID counter ----
  const [nextNewSectionId, setNextNewSectionId] = useState(0);

  // ---- Form state ----
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
    keyDate: new Date().toISOString().slice(0, 10),
    previewImageUrl: "",
    sizeM2FT2: "",
    lat: "",
    lng: "",
  });

  // ---- Sections (text/image/gif) ----
  const [sections, setSections] = useState([]); // [{type: 'text'|'image'|'gif', content: string}]
  const [selectedCategory, setSelectedCategory] = useState("");
  const [availableSubCategories, setAvailableSubCategories] = useState([]);

  // ---- Preview upload ----
  const [previewFile, setPreviewFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);

  // ---- Tags ----
  const [tagInput, setTagInput] = useState("");
  const [savedTags, setSavedTags] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // ---- Leader dropdown ----
  const [showLeaderDropdown, setShowLeaderDropdown] = useState(false);

  // ---- Effects ----
  useEffect(() => {
    // Fetch saved tags from existing projects; fallback to sensible defaults on error
    const fetchSavedTags = async () => {
      try {
        const projects = await projectApi.getProjects();
        const tagsSet = new Set();
        projects.forEach((p) => {
          if (Array.isArray(p.tags)) {
            p.tags.forEach((t) => {
              if (typeof t === "string") tagsSet.add(t.toUpperCase());
            });
          }
        });
        setSavedTags(Array.from(tagsSet));
      } catch {
        // fallback tags
        setSavedTags([
          "SUSTAINABLE",
          "GREEN_BUILDING",
          "LOW_COST",
          "MODULAR_DESIGN",
          "HERITAGE_PRESERVATION",
        ]);
        // Debug log for dev
        // console.error("Failed to fetch saved tags", err);
      }
    };

    fetchSavedTags();

    return () => {
      if (previewURL) URL.revokeObjectURL(previewURL);
    };
  }, [previewURL]);

  // ---- Form field handlers ----
  const handleCategoryChange = (e) => {
    const category = e.target.value ? e.target.value.toUpperCase() : "";
    setSelectedCategory(category);
    setAvailableSubCategories(filterOptions[category] || []);
    setFormData((prev) => ({ ...prev, category, subCategory: "" }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Fields that should be automatically uppercased
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

  // ---- Leader multi-select toggle ----
  const handleLeaderToggle = (leader) => {
    setFormData((prev) => {
      const exists = prev.projectLeaders.includes(leader);
      const leaders = exists
        ? prev.projectLeaders.filter((l) => l !== leader)
        : [...prev.projectLeaders, leader];
      return { ...prev, projectLeaders: leaders };
    });
  };

  // ---- Preview file handlers ----
  const handlePreviewChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_PREVIEW_SIZE_BYTES) {
      toast.error("⚠️ File exceeds 900 KB");
      return;
    }

    // revoke old URL to avoid memory leaks
    if (previewURL) URL.revokeObjectURL(previewURL);

    const url = URL.createObjectURL(file);
    setPreviewFile(file);
    setPreviewURL(url);
  };

  // ---- Tag handlers ----
  const handleAddTag = (tag = null) => {
    const newTag = (tag || tagInput).trim().toUpperCase();
    if (!newTag) return;
    if (formData.tags.includes(newTag)) {
      setTagInput("");
      setShowDropdown(false);
      return;
    }

    setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag] }));

    // keep savedTags up-to-date
    setSavedTags((prev) => {
      if (!prev.includes(newTag)) return [...prev, newTag];
      return prev;
    });

    setTagInput("");
    setShowDropdown(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  // ---- Section (editor) handlers ----
  const handleAddText = () => {
    setSections((prev) => [
      ...prev,
      { type: "text", content: "", tempId: `new-${nextNewSectionId}` },
    ]);
    setNextNewSectionId((prev) => prev + 1);
  };

  const handleAddImage = (file) => {
    if (!file) return;
    const tempId = `new-${nextNewSectionId}`;
    setNextNewSectionId((prev) => prev + 1);
    const reader = new FileReader();
    reader.onloadend = () =>
      setSections((prev) => [
        ...prev,
        { type: "image", content: reader.result, tempId },
      ]);
    reader.readAsDataURL(file);
  };

  const handleAddGif = (file) => {
    if (!file) return;
    const tempId = `new-${nextNewSectionId}`;
    setNextNewSectionId((prev) => prev + 1);
    const reader = new FileReader();
    reader.onloadend = () =>
      setSections((prev) => [...prev, { type: "gif", content: reader.result, tempId }]);
    reader.readAsDataURL(file);
  };

  const handleAddVideoLink = () => {
    setSections((prev) => [
      ...prev,
      { type: "video", content: "", tempId: `new-${nextNewSectionId}` },
    ]);
    setNextNewSectionId((prev) => prev + 1);
  };

  const handleContentChange = (index, value) => {
    // Enforce a reasonable text length client-side (mirrors original)
    if (value.length > MAX_TEXT_LENGTH) return;
    setSections((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], content: value };
      return copy;
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

  // ---- Submit handler ----
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();

    if (
      !trimmedName ||
      !formData.client ||
      !formData.projectTeam ||
      !formData.location
    ) {
      toast.error(
        "Please fill required fields: Project Name, Client, Project Team, Location."
      );
      return;
    }

    const fd = new FormData();

    const payloadData = {
      ...formData,
      name: trimmedName,
    };

    Object.keys(payloadData).forEach((key) => {
      const value = payloadData[key];
      if (Array.isArray(value)) {
        fd.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        fd.append(key, value);
      }
    });

    // Clean sections - remove tempId
    const cleanSections = sections.map(({ type, content, publicId }) => ({
      type,
      content,
      ...(publicId ? { publicId } : {}),
    }));

    fd.append("sections", JSON.stringify(cleanSections));

    if (previewFile) {
      fd.append("previewImage", previewFile);
    }

    try {
      toast.info("Submitting project...");
      await projectApi.createProject(fd);
      toast.success("Project created successfully!");

      // Reset form after successful creation
      setFormData({
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
        keyDate: new Date().toISOString().slice(0, 10),
        previewImageUrl: "",
        sizeM2FT2: "",
        lat: "",
        lng: "",
      });
      setSections([]);
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
        setPreviewURL(null);
        setPreviewFile(null);
      }
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to create project";
      toast.error(message);
    }
  };

  return (
    <div className="flex-1 p-6 bg-[#F5F1EE]">
      <ToastContainer position="top-right" autoClose={3000} />
      <nav className="text-sm font-medium mb-4 text-[#722F37]">
        <span>Projects</span> &gt; <span>Add Project</span>
      </nav>

      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded p-6 flex flex-col gap-6"
      >
        <div className="grid grid-cols-2 gap-6 items-start">
          <div>
            <MandatoryFields
              formData={formData}
              handleChange={handleChange}
              handleCategoryChange={handleCategoryChange}
              selectedCategory={selectedCategory}
              availableSubCategories={availableSubCategories}
              handleLeaderToggle={handleLeaderToggle}
              showLeaderDropdown={showLeaderDropdown}
              setShowLeaderDropdown={setShowLeaderDropdown}
              PROJECT_LEADERS_OPTIONS={PROJECT_LEADERS_OPTIONS}
            />
          </div>

          <div>
            <PreviewUploader
              previewURL={previewURL}
              handlePreviewChange={handlePreviewChange}
            />
            {/* Size / Year / Status inputs are in MandatoryFields; preview lives here */}
          </div>
        </div>

        <ProjectTags
          formData={formData}
          tagInput={tagInput}
          savedTags={savedTags}
          handleAddTag={handleAddTag}
          handleRemoveTag={handleRemoveTag}
          setTagInput={setTagInput}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
        />

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
                onChange={(e) => handleAddImage(e.target.files[0])}
              />
            </label>
            <label className="px-4 py-2 text-sm rounded bg-[#454545] text-white cursor-pointer hover:bg-[#666666]">
              + Add GIF
              <input
                type="file"
                accept=".gif,image/gif"
                className="hidden"
                onChange={(e) => handleAddGif(e.target.files[0])}
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
          Submit Project
        </button>
      </form>
    </div>
  );
};

export default AddProject;
