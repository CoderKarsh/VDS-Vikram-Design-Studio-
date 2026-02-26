import axios from "axios";

const API_BASE = `${
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
}`;

const ROLES_BASE = `${API_BASE}/roles`;
const APPLICATIONS_BASE = `${API_BASE}/applications`;

const jobApi = {
  /* =========================
     ADMIN
  ========================= */

  getAllRolesAdmin: async () => {
    const response = await axios.get(`${ROLES_BASE}/admin/all`);
    return response.data;
  },

  /* =========================
     ROLES
  ========================= */

  getRoles: async () => {
    const response = await axios.get(ROLES_BASE);
    return response.data;
  },

  // ✅ CITY REQUIRED NOW
  getRoleBySlug: async (slug, city) => {
    const response = await axios.get(`${ROLES_BASE}/${slug}`, {
      params: { city },
    });
    return response.data;
  },

  // ✅ CITY-BASED TOGGLE
  toggleRoleStatus: async (roleId, city, state) => {
    const response = await axios.patch(`${ROLES_BASE}/${roleId}/status`, {
      city,
      state,
    });
    return response.data;
  },

  /* =========================
     APPLICATIONS
  ========================= */

  submitApplication: async (formData) => {
    const maxAttempts = 2;
    const timeoutMs = 120000; // 2 minutes

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.post(APPLICATIONS_BASE, formData, {
          timeout: timeoutMs,
        });

        return response.data;
      } catch (err) {
        // If last attempt, rethrow so caller can handle
        if (attempt === maxAttempts) throw err;

        // Small backoff before retrying
        await new Promise((res) => setTimeout(res, 1000 * attempt));
      }
    }
  },

  getApplications: async () => {
    const response = await axios.get(APPLICATIONS_BASE);
    return response.data;
  },

  // ✅ CITY FILTER OPTIONAL
  getApplicationsByRole: async (roleSlug, city) => {
    const response = await axios.get(`${APPLICATIONS_BASE}/role/${roleSlug}`, {
      params: city ? { city } : {},
    });
    return response.data;
  },

  updateApplicationStatus: async (id, status) => {
    const response = await axios.patch(`${APPLICATIONS_BASE}/${id}/status`, {
      status,
    });
    return response.data;
  },

  deleteApplication: async (id) => {
    const response = await axios.delete(`${APPLICATIONS_BASE}/${id}`);
    return response.data;
  },
};

export default jobApi;
