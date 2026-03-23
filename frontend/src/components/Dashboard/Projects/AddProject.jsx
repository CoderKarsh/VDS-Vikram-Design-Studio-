// src/pages/Projects/AddProject/AddProject.jsx
import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import projectApi from "../../../services/projectApi";
import { PROJECT_LEADERS_OPTIONS, filterOptions } from "./constants";
import MandatoryFields from "./components/MandatoryFields";
import PreviewUploader from "./components/PreviewUploader";
import ProjectTags from "./components/ProjectTags";
import ProjectSections from "./components/ProjectSections";

const MAX_PREVIEW_SIZE_BYTES = 900 * 1024; // 900 KB

const AddProject = () => {
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
  const handleAddText = () =>
    setSections((prev) => [...prev, { type: "text", content: "" }]);

  const handleAddImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setSections((prev) => [
        ...prev,
        { type: "image", content: reader.result },
      ]);
    reader.readAsDataURL(file);
  };

  const handleAddGif = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setSections((prev) => [...prev, { type: "gif", content: reader.result }]);
    reader.readAsDataURL(file);
  };

  const handleAddVideoLink = () =>
    setSections((prev) => [...prev, { type: "video", content: "" }]);

  const handleContentChange = (index, value) => {
    // Enforce a reasonable text length client-side (mirrors original)
    const MAX_TEXT_LENGTH = 700;
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

    fd.append("sections", JSON.stringify(sections));

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

        <ProjectSections
          sections={sections}
          handleAddText={handleAddText}
          handleAddImage={handleAddImage}
          handleAddGif={handleAddGif}
          handleAddVideoLink={handleAddVideoLink}
          handleContentChange={handleContentChange}
          handleRemoveContent={handleRemoveContent}
          handleDragEnd={handleDragEnd}
        />

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
