import { useState } from "react";
import {
  FiUser,
  FiLock,
  FiGlobe,
  FiBell,
  FiSave,
  FiCheck,
  FiAlertCircle,
  FiX,
  FiUpload,
  FiShield,
  FiMail,
  FiPhone,
  FiMapPin,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

/* ================================================================== */
/*  Toast                                                              */
/* ================================================================== */

const Toast = ({ message, type = "success", onClose }) => {
  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-400"
      : "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/30 dark:text-green-400";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[10000] flex justify-center px-4">
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${styles}`}
      >
        {type === "error" ? <FiAlertCircle size={16} /> : <FiCheck size={16} />}
        <span>{message}</span>
        <button type="button" onClick={onClose} className="ml-2 shrink-0">
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Reusable Field components                                          */
/* ================================================================== */

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    {hint && (
      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{hint}</p>
    )}
    <div className="mt-2">{children}</div>
  </div>
);

const TextInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && (
      <Icon
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
      />
    )}
    <input
      {...props}
      className={`h-11 w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-green-500 dark:focus:ring-green-900/50 ${
        Icon ? "pl-10 pr-3.5" : "px-3.5"
      }`}
    />
  </div>
);

// 🔥 FIXED: Removed the unused "field" prop
const PasswordInput = ({
  placeholder,
  showKey,
  show,
  onToggle,
  value,
  onChange,
}) => (
  <div className="relative">
    <input
      type={show[showKey] ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-3.5 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-green-500 dark:focus:ring-green-900/50"
    />
    <button
      type="button"
      onClick={() => onToggle(showKey)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
    >
      {show[showKey] ? <FiEyeOff size={16} /> : <FiEye size={16} />}
    </button>
  </div>
);

const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {label}
      </p>
      {description && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked
          ? "bg-green-600 dark:bg-green-500"
          : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition dark:bg-gray-200 ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  </div>
);

/* ================================================================== */
/*  Tabs                                                               */
/* ================================================================== */

const TABS = [
  { id: "profile", label: "Profile", icon: FiUser },
  { id: "security", label: "Security", icon: FiLock },
  { id: "platform", label: "Platform", icon: FiGlobe },
  { id: "notifications", label: "Notifications", icon: FiBell },
];

/* ================================================================== */
/*  Tab Panels                                                         */
/* ================================================================== */

const ProfilePanel = ({ onSave }) => {
  const [form, setForm] = useState({
    fullName: "Administrator",
    email: "admin@landmanage.com",
    phone: "+91 98765 43210",
    location: "Gujarat, India",
    bio: "Managing land listings and users across the platform.",
  });

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSave("Profile updated successfully.");
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5 rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-800/50">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
          AD
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Profile Photo
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            JPG or PNG. Max 2MB.
          </p>
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <FiUpload size={14} />
            Upload New
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Full Name">
          <TextInput
            icon={FiUser}
            value={form.fullName}
            onChange={update("fullName")}
            placeholder="Enter your name"
          />
        </Field>

        <Field label="Email Address">
          <TextInput
            icon={FiMail}
            type="email"
            value={form.email}
            onChange={update("email")}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Phone Number">
          <TextInput
            icon={FiPhone}
            value={form.phone}
            onChange={update("phone")}
            placeholder="+91 ..."
          />
        </Field>

        <Field label="Location">
          <TextInput
            icon={FiMapPin}
            value={form.location}
            onChange={update("location")}
            placeholder="City, Country"
          />
        </Field>
      </div>

      <Field label="Bio" hint="Short description shown on your profile.">
        <textarea
          rows={4}
          value={form.bio}
          onChange={update("bio")}
          className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-green-500 dark:focus:ring-green-900/50"
          placeholder="Write a short bio..."
        />
      </Field>

      <div className="flex justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500"
        >
          <FiSave size={16} />
          Save Profile
        </button>
      </div>
    </form>
  );
};

const SecurityPanel = ({ onSave }) => {
  const [show, setShow] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [form, setForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const toggle = (key) => setShow((prev) => ({ ...prev, [key]: !prev[key] }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.current || !form.next || !form.confirm) {
      onSave("Please fill all password fields.", "error");
      return;
    }
    if (form.next !== form.confirm) {
      onSave("New passwords do not match.", "error");
      return;
    }
    if (form.next.length < 6) {
      onSave("Password must be at least 6 characters.", "error");
      return;
    }
    setForm({ current: "", next: "", confirm: "" });
    onSave("Password updated successfully.");
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <FiShield
            size={18}
            className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
          />
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              Password Security
            </p>
            <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
              Use a strong password with at least 6 characters, mixing letters
              and numbers.
            </p>
          </div>
        </div>
      </div>

      <Field label="Current Password">
        {/* 🔥 FIXED: Removed field="current" */}
        <PasswordInput
          placeholder="Enter current password"
          showKey="current"
          show={show}
          onToggle={toggle}
          value={form.current}
          onChange={update("current")}
        />
      </Field>

      <Field label="New Password">
        {/* 🔥 FIXED: Removed field="next" */}
        <PasswordInput
          placeholder="Enter new password"
          showKey="next"
          show={show}
          onToggle={toggle}
          value={form.next}
          onChange={update("next")}
        />
      </Field>

      <Field label="Confirm New Password">
        {/* 🔥 FIXED: Removed field="confirm" */}
        <PasswordInput
          placeholder="Re-enter new password"
          showKey="confirm"
          show={show}
          onToggle={toggle}
          value={form.confirm}
          onChange={update("confirm")}
        />
      </Field>

      <div className="flex justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500"
        >
          <FiLock size={15} />
          Update Password
        </button>
      </div>
    </form>
  );
};

const PlatformPanel = ({ onSave }) => {
  const [form, setForm] = useState({
    siteName: "LandManage",
    supportEmail: "support@landmanage.com",
    supportPhone: "+91 98765 43210",
    defaultUnit: "sqft",
    currency: "INR",
    address: "Ahmedabad, Gujarat, India",
  });

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSave("Platform settings saved.");
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Platform Name">
          <TextInput
            value={form.siteName}
            onChange={update("siteName")}
            placeholder="LandManage"
          />
        </Field>

        <Field label="Support Email">
          <TextInput
            icon={FiMail}
            type="email"
            value={form.supportEmail}
            onChange={update("supportEmail")}
          />
        </Field>

        <Field label="Support Phone">
          <TextInput
            icon={FiPhone}
            value={form.supportPhone}
            onChange={update("supportPhone")}
          />
        </Field>

        <Field label="Currency">
          <select
            value={form.currency}
            onChange={update("currency")}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-green-500 dark:focus:ring-green-900/50"
          >
            <option value="INR">INR — Indian Rupee (₹)</option>
            <option value="USD">USD — US Dollar ($)</option>
            <option value="EUR">EUR — Euro (€)</option>
            <option value="GBP">GBP — British Pound (£)</option>
          </select>
        </Field>

        <Field label="Default Area Unit">
          <select
            value={form.defaultUnit}
            onChange={update("defaultUnit")}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-green-500 dark:focus:ring-green-900/50"
          >
            <option value="sqft">Square Feet (sqft)</option>
            <option value="sqm">Square Meters (sqm)</option>
            <option value="acre">Acre</option>
            <option value="hectare">Hectare</option>
            <option value="guntha">Guntha</option>
            <option value="vigha">Vigha</option>
          </select>
        </Field>

        <Field label="Office Address">
          <TextInput
            icon={FiMapPin}
            value={form.address}
            onChange={update("address")}
          />
        </Field>
      </div>

      <div className="flex justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500"
        >
          <FiSave size={16} />
          Save Platform Settings
        </button>
      </div>
    </form>
  );
};

const NotificationsPanel = ({ onSave }) => {
  const [prefs, setPrefs] = useState({
    newUser: true,
    newLand: true,
    landApproval: true,
    weeklyDigest: false,
    securityAlerts: true,
    marketingEmails: false,
  });

  const toggle = (key) => (value) =>
    setPrefs((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Email Notifications
        </h3>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Choose which events should trigger an email alert to your inbox.
        </p>
        <div className="mt-4 space-y-3">
          <Toggle
            label="New user registration"
            description="Get notified when someone signs up."
            checked={prefs.newUser}
            onChange={toggle("newUser")}
          />
          <Toggle
            label="New land listing"
            description="Alert when a new land is submitted."
            checked={prefs.newLand}
            onChange={toggle("newLand")}
          />
          <Toggle
            label="Land approval requests"
            description="Notify when a listing needs admin approval."
            checked={prefs.landApproval}
            onChange={toggle("landApproval")}
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Other Notifications
        </h3>
        <div className="mt-4 space-y-3">
          <Toggle
            label="Weekly summary digest"
            description="A weekly recap of platform activity."
            checked={prefs.weeklyDigest}
            onChange={toggle("weeklyDigest")}
          />
          <Toggle
            label="Security alerts"
            description="Suspicious logins and password changes."
            checked={prefs.securityAlerts}
            onChange={toggle("securityAlerts")}
          />
          <Toggle
            label="Marketing & product updates"
            description="Occasional news from the team."
            checked={prefs.marketingEmails}
            onChange={toggle("marketingEmails")}
          />
        </div>
      </div>

      <div className="flex justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
        <button
          type="button"
          onClick={() => onSave("Notification preferences saved.")}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500"
        >
          <FiSave size={16} />
          Save Preferences
        </button>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Main                                                               */
/* ================================================================== */

function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account, security, and platform preferences.
        </p>
      </div>

      {/* Tab bar */}
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-1 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm sm:min-w-0 dark:border-gray-800 dark:bg-gray-900">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
                  isActive
                    ? "bg-green-600 text-white shadow-sm dark:bg-green-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel card */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-800 dark:bg-gray-900">
        {activeTab === "profile" && <ProfilePanel onSave={showToast} />}
        {activeTab === "security" && <SecurityPanel onSave={showToast} />}
        {activeTab === "platform" && <PlatformPanel onSave={showToast} />}
        {activeTab === "notifications" && (
          <NotificationsPanel onSave={showToast} />
        )}
      </section>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default Settings;