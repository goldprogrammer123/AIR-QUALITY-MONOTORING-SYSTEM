import React, { useState, useEffect } from "react";

const Settings = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [username, setUsername] = useState("John Doe");
  const [email, setEmail] = useState("johndoe@example.com");
  const [notifications, setNotifications] = useState(true);
  const [password, setPassword] = useState("");

  // Apply theme changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className={`min-h-screen flex justify-center items-center ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"} p-6`}>
      <div className={`w-full max-w-lg shadow-lg rounded-lg p-6 transition ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
        <h2 className="text-2xl font-bold text-center mb-4">⚙️ Settings</h2>

        {/* Profile Section */}
        <div className="mb-4">
          <label className="block font-medium mb-1">👤 Username</label>
          <input
            type="text"
            className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-300"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">✉️ Email</label>
          <input
            type="email"
            className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Preferences Section */}
        <div className="mb-4 flex justify-between items-center">
          <label className="font-medium">🎛 Theme</label>
          <select
            className="p-2 border rounded-lg"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="light">🌞 Light Mode</option>
            <option value="dark">🌙 Dark Mode</option>
          </select>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <label className="font-medium">🔔 Notifications</label>
          <input
            type="checkbox"
            className="w-5 h-5 accent-blue-600"
            checked={notifications}
            onChange={() => setNotifications(!notifications)}
          />
        </div>

        {/* Change Password Section */}
        <div className="mb-4">
          <label className="block font-medium mb-1">🔐 Change Password</label>
          <input
            type="password"
            className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition">
            Reset
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
