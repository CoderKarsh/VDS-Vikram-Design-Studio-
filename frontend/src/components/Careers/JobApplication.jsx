import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import jobApi from "../../services/jobApi";

// ✅ VITE ENV
const API_KEY = import.meta.env.VITE_CSC_API_KEY;

/* =========================
   FIELD RENDERER
========================= */

const FieldRenderer = ({
  field,
  defaultValue,
  onChange,
  countries,
  states,
  cities,
  selectedCountry,
  selectedState,
}) => {
  const commonProps = {
    name: field.name,
    required: field.required,
    value: defaultValue || "",
    placeholder: field.placeholder || "",
    className:
      "border border-[#E3E1DF] rounded px-3 py-2 text-sm focus:outline-none w-full",
  };

  switch (field.type) {
    case "textarea":
      return <textarea {...commonProps} rows={4} onChange={onChange} />;

    case "select":
      if (field.name === "country") {
        return (
          <select {...commonProps} onChange={onChange}>
            <option value="">Select Country</option>
            {countries.map((c) => (
              <option key={c.iso2} value={c.iso2}>
                {c.name}
              </option>
            ))}
          </select>
        );
      }

      if (field.name === "state") {
        return (
          <select
            {...commonProps}
            onChange={onChange}
            disabled={!selectedCountry}
          >
            <option value="">
              {selectedCountry ? "Select State" : "Select Country First"}
            </option>
            {states.map((s) => (
              <option key={s.iso2} value={s.iso2}>
                {s.name}
              </option>
            ))}
          </select>
        );
      }

      if (field.name === "city") {
        return (
          <select
            {...commonProps}
            onChange={onChange}
            disabled={!selectedState}
          >
            <option value="">
              {selectedState ? "Select City" : "Select State First"}
            </option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        );
      }

      return (
        <select {...commonProps} onChange={onChange}>
          <option value="">Select</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case "radio":
      return (
        <div className="flex flex-wrap gap-6 text-sm">
          {field.options.map((opt) => (
            <label key={opt} className="flex gap-2">
              <input
                type="radio"
                name={field.name}
                value={opt}
                checked={defaultValue === opt}
                onChange={onChange}
              />
              {opt}
            </label>
          ))}
        </div>
      );

    case "checkbox":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {field.options.map((opt) => (
            <label key={opt} className="flex gap-2">
              <input
                type="checkbox"
                name={field.name}
                value={opt}
                checked={(defaultValue || []).includes(opt)}
                onChange={onChange}
              />
              {opt}
            </label>
          ))}
        </div>
      );

    case "file":
      return (
        <input
          type="file"
          name={field.name}
          accept="application/pdf"
          required={field.required}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // ✅ Allow only PDF
            if (file.type !== "application/pdf") {
              alert("Only PDF files allowed.");
              return;
            }

            // ✅ Max size = 1MB
            if (file.size > 1024 * 1024) {
              alert("File must be less than 1MB.");
              return;
            }

            onChange({
              target: {
                name: field.name,
                value: file,
                type: "file"
              }
            });
          }}
          className="border border-[#E3E1DF] rounded px-3 py-2 text-sm w-full"
        />
      );


    default:
      return <input type={field.type} {...commonProps} onChange={onChange} />;
  }
};

/* =========================
   MAIN COMPONENT
========================= */

const JobApplication = ({ role }) => {
  const navigate = useNavigate();
  const { slug } = useParams();

  // ✅ CITY COMES FROM URL (?city=Kolkata)
  const [searchParams] = useSearchParams();
  const selectedRoleCity = searchParams.get("city");

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  /* =========================
     LOCATION API
  ========================= */

  const getStatesByCountry = useCallback(async (countryCode) => {
    if (!API_KEY) return [];

    const res = await fetch(
      `https://api.countrystatecity.in/v1/countries/${countryCode}/states`,
      { headers: { "X-CSCAPI-KEY": API_KEY } }
    );

    return res.ok ? res.json() : [];
  }, []);

  const getCitiesByState = useCallback(async (countryCode, stateCode) => {
    if (!API_KEY) return [];

    const res = await fetch(
      `https://api.countrystatecity.in/v1/countries/${countryCode}/states/${stateCode}/cities`,
      { headers: { "X-CSCAPI-KEY": API_KEY } }
    );

    return res.ok ? res.json() : [];
  }, []);

  /* =========================
     LOAD COUNTRIES
  ========================= */

  useEffect(() => {
    if (!API_KEY) return;

    fetch("https://api.countrystatecity.in/v1/countries", {
      headers: { "X-CSCAPI-KEY": API_KEY },
    })
      .then((r) => {
        if (!r.ok) {
          // console.error("CSC API error status:", r.status, r.statusText);
          return [];
        }

        return r.json();
      })
      .then((data) => {
        setCountries(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        setCountries([]);
      });
  }, []);

  /* =========================
     COUNTRY → STATES
  ========================= */

  useEffect(() => {
    if (!answers.country) return;

    getStatesByCountry(answers.country).then(setStates);
    setCities([]);

    setAnswers((p) => ({ ...p, state: "", city: "" }));
  }, [answers.country]);

  /* =========================
     STATE → CITIES
  ========================= */

  useEffect(() => {
    if (!answers.country || !answers.state) return;

    getCitiesByState(answers.country, answers.state).then(setCities);

    setAnswers((p) => ({ ...p, city: "" }));
  }, [answers.state]);

  /* =========================
     GROUP SECTIONS
  ========================= */

  const sections = useMemo(() => {
    return role.fields.reduce((acc, field) => {
      acc[field.section] = acc[field.section] || [];
      acc[field.section].push(field);

      return acc;
    }, {});
  }, [role.fields]);

  /* =========================
     HANDLERS
  ========================= */

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setAnswers((prev) => {
      if (type === "checkbox") {
        const current = prev[name] || [];

        return {
          ...prev,
          [name]: checked
            ? [...current, value]
            : current.filter((v) => v !== value),
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!slug || !selectedRoleCity) {
      alert("Invalid role or city.");
      return;
    }

    setLoading(true);

    try {
      await jobApi.submitApplication({
        roleSlug: slug,
        city: selectedRoleCity, // ✅ REQUIRED FOR BACKEND
        applicant: {
          name: answers.fullName || answers.name || answers.firstName || "",
          email: answers.email || answers.email_address || "",
        },
        answers,
      });

      setSubmitted(true);

      setTimeout(() => navigate("/careers"), 5000);
    } catch (err) {
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================= */

  return (
    <>
      {submitted && (
        <div className="fixed top-0 left-0 w-full bg-[#d3ceca] text-black text-sm py-3 text-center z-50">
          Application submitted successfully. Redirecting…
        </div>
      )}


      <form
        onSubmit={handleSubmit}
        className={`space-y-14 ${submitted ? "mt-14" : ""}`}
      >
        {Object.entries(sections).map(([section, fields], idx) => (
          <section key={section}>
            <h2 className="text-lg font-semibold mb-6">
              {idx + 1}. {section}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map((field) => (
                <div key={field.name} className="flex flex-col gap-1">
                  <label className="text-sm text-[#6D6D6D]">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>

                  <FieldRenderer
                    field={field}
                    defaultValue={answers[field.name]}
                    onChange={handleChange}
                    countries={countries}
                    states={states}
                    cities={cities}
                    selectedCountry={answers.country}
                    selectedState={answers.state}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}

        <button
          type="submit"
          disabled={submitted || loading}
          className={`px-8 py-3 rounded text-sm font-medium w-full md:w-auto ${submitted || loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-black text-white hover:bg-gray-800"
            }`}
        >
          {submitted
            ? "Submitted!"
            : loading
              ? "Submitting..."
              : "Submit Application"}
        </button>
      </form>
    </>
  );
};

export default JobApplication;
