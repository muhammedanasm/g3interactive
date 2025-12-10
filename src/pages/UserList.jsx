import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import Swal from "sweetalert2";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // ''=All, '1'=Active, '0'=Inactive
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination setting (per PDF: 10 per page)
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]); // Refetch when filter changes

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Postman: /api/user?status=1 (or 0 or null)
      const params = {};
      if (statusFilter !== "") params.status = statusFilter;

      const response = await api.get("/api/user", { params });
      // Postman response structure: { status: true, data: [...] }
      setUsers(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic (Search is client-side real-time per PDF)
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const name = (user.first_name + " " + (user.last_name || "")).toLowerCase();
    const email = user.email.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus ? 0 : 1;
    try {
      await api.post(`/api/user/${id}/status`, { status: newStatus });

      // Update UI locally
      setUsers(
        users.map((u) => (u.id === id ? { ...u, status: newStatus === 1 } : u))
      );

      // Show toast (PDF Page 2)
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      Toast.fire({ icon: "success", title: "Status updated successfully" });
    } catch (error) {
      Swal.fire("Error", "Failed to update status", "error");
    }
  };

  const handleDelete = (id) => {
    // PDF Page 3: Confirmation Popup
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/api/user/${id}`);
          setUsers(users.filter((u) => u.id !== id));
          Swal.fire("Deleted!", "User has been deleted.", "success");
        } catch (error) {
          Swal.fire("Error", "Failed to delete user", "error");
        }
      }
    });
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">User List</h2>
        <Link
          to="/users/add"
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
        >
          <FaPlus /> Add New User
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-3 py-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        <select
          className="border rounded px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Select Status</option>
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 border">S.No</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Initials</th>
              <th className="px-4 py-2 border">Phone</th>
              <th className="px-4 py-2 border">Role</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Title</th>
              <th className="px-4 py-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  No users found
                </td>
              </tr>
            ) : (
              currentItems.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">
                    {indexOfFirstItem + index + 1}
                  </td>
                  <td className="px-4 py-2 border">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-4 py-2 border">{user.email}</td>
                  <td className="px-4 py-2 border">{user.initials || "N/A"}</td>
                  <td className="px-4 py-2 border">{user.phone || "N/A"}</td>
                  <td className="px-4 py-2 border">
                    {user.role?.title || "User"}
                  </td>
                  <td className="px-4 py-2 border">
                    <button
                      onClick={() => handleStatusToggle(user.id, user.status)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.status
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-2 border">{user.title || "N/A"}</td>
                  <td className="px-4 py-2 border flex gap-2">
                    <Link
                      to={`/users/edit/${user.id}`}
                      className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200"
                    >
                      <FaEdit />
                    </Link>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="bg-red-100 text-red-600 p-2 rounded hover:bg-red-200"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end mt-4 gap-2 items-center">
        <span className="text-sm text-gray-600">
          Rows per page: {itemsPerPage}
        </span>
        <span className="text-sm text-gray-600">
          {indexOfFirstItem + 1}-
          {Math.min(indexOfLastItem, filteredUsers.length)} of{" "}
          {filteredUsers.length}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            &lt;
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserList;
