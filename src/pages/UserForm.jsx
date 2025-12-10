import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axiosConfig";
import Swal from "sweetalert2";
import { FaTrash, FaCamera } from "react-icons/fa";

const UserForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Initial State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    title: "",
    initials: "",
    responsibilities: [],
    user_picture: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [rolesList, setRolesList] = useState([]);
  const [respList, setRespList] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch dropdowns and user data if edit
  useEffect(() => {
    fetchDropdowns();
    if (isEditMode) {
      fetchUserData();
    }
  }, [id]);

  const fetchDropdowns = async () => {
    try {
      // Fetch Roles
      const roleRes = await api.post("/role/dropdown", { type: "0" });
      const roles = roleRes.data.data.other_roles || [];
      // Merge admin/owner if needed, but Postman shows other_roles array
      setRolesList(roles);

      // Fetch Responsibilities
      const respRes = await api.get("/user/dropdown-responsibility");
      setRespList(respRes.data || []);
    } catch (error) {
      console.error("Error loading dropdowns", error);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await api.get(`/api/user/${id}`);
      const user = response.data.data;

      setFormData({
        name: user.first_name + (user.last_name ? " " + user.last_name : ""),
        email: user.email,
        role: user.role_type, // or user.role.id
        phone: user.phone || "",
        title: user.title || "",
        initials: user.initials || "",
        responsibilities: [], // API response doesn't strictly show where responsibilities are stored in 'show user', assuming array
        user_picture: null,
      });

      if (user.profile_image_url) {
        setImagePreview(user.profile_image_url);
      }
    } catch (error) {
      Swal.fire("Error", "Failed to load user data", "error");
      navigate("/users");
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.role) newErrors.role = "Role is required";

    // Responsibilities Validation (PDF Page 5: At least one)
    if (formData.responsibilities.length === 0) {
      newErrors.responsibilities = "Select at least one responsibility";
    }

    // Phone Validation (Digits only, 10-15)
    if (formData.phone) {
      if (!/^\d+$/.test(formData.phone)) {
        newErrors.phone = "Phone number must contain only digits";
      } else if (formData.phone.length < 10 || formData.phone.length > 15) {
        newErrors.phone = "Phone must be between 10-15 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCheckboxChange = (respId) => {
    setFormData((prev) => {
      const current = prev.responsibilities;
      if (current.includes(respId)) {
        return {
          ...prev,
          responsibilities: current.filter((id) => id !== respId),
        };
      } else {
        return { ...prev, responsibilities: [...current, respId] };
      }
    });
    if (errors.responsibilities)
      setErrors((prev) => ({ ...prev, responsibilities: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, user_picture: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setFormData((prev) => ({ ...prev, user_picture: null }));
    setImagePreview(null);
    fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("role", formData.role);
    data.append("phone", formData.phone);
    data.append("title", formData.title);
    data.append("initials", formData.initials);
    data.append("overwite_data", "1"); // From Postman
    // Postman expects array format for responsibilities, e.g. [1,2]
    data.append("responsibilities", JSON.stringify(formData.responsibilities));

    if (formData.user_picture) {
      data.append("user_picture", formData.user_picture);
    }

    if (isEditMode) {
      data.append("_method", "put"); // Crucial for Laravel Update via POST
    }

    try {
      const url = isEditMode ? `/api/user/${id}` : "/api/user";
      await api.post(url, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.fire({
        icon: "success",
        title: "Success",
        text: `User ${isEditMode ? "updated" : "created"} successfully`,
        timer: 1500,
        showConfirmButton: false,
      }).then(() => navigate("/users"));
    } catch (error) {
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const backendErrors = {};
        Object.keys(error.response.data.errors).forEach((key) => {
          backendErrors[key] = error.response.data.errors[key][0];
        });
        setErrors(backendErrors);
      } else {
        Swal.fire("Error", "Failed to save user", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded shadow max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-6">
        {isEditMode ? "Edit User" : "Add New User"}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Image Upload Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mb-2">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-400 text-3xl">?</span>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full text-xs"
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                opacity: 0,
              }}
            >
              Upload
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="text-blue-600 text-sm flex items-center gap-1"
            >
              <FaCamera /> Upload Photo
            </button>
            {imagePreview && (
              <button
                type="button"
                onClick={clearImage}
                className="text-red-500 text-sm flex items-center gap-1"
              >
                <FaTrash /> Remove
              </button>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />
        </div>

        {/* Form Fields - 2 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
              placeholder="Enter your name"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
              placeholder="Enter email"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
              placeholder="Enter your title"
            />
          </div>

          {/* Initials */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Initials
            </label>
            <input
              name="initials"
              value={formData.initials}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
              placeholder="Enter your initials"
            />
          </div>

          {/* Role Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
            >
              <option value="">Select your role</option>
              {rolesList.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="text-red-500 text-xs mt-1">{errors.role}</p>
            )}
          </div>
        </div>

        {/* Responsibilities */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Responsibilities <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col gap-2">
            {respList.map((resp) => (
              <label key={resp.id} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox text-primary"
                  checked={formData.responsibilities.includes(resp.id)}
                  onChange={() => handleCheckboxChange(resp.id)}
                />
                <span className="ml-2 text-gray-700 text-sm">{resp.title}</span>
              </label>
            ))}
          </div>
          {errors.responsibilities && (
            <p className="text-red-500 text-xs mt-1">
              {errors.responsibilities}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/users")}
            className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
