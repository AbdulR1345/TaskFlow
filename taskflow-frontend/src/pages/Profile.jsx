import { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../utils/api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const Profile = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarSource, setAvatarSource] = useState("");
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropScale, setCropScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name, email: user.email });
      setAvatarPreview(user.avatarUrl || "");
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const res = await API.put("/auth/profile", { name: profile.name.trim() });
      updateUser(res.data.user);
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }

    setLoading(false);
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const getCropBounds = (scale = cropScale) => {
    const scaledWidth = imageDimensions.width * scale;
    const scaledHeight = imageDimensions.height * scale;

    return {
      x: Math.max(0, (scaledWidth - 320) / 2),
      y: Math.max(0, (scaledHeight - 320) / 2),
    };
  };

  const resetPendingAvatar = () => {
    setAvatarFile(null);
    setAvatarSource("");
    setCropOffset({ x: 0, y: 0 });
    setCropScale(minScale || 1);
    setMinScale(1);
    setImageDimensions({ width: 0, height: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    setSuccess("");
    setError("");

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result;
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        const fitScale = Math.max(
          1,
          320 / img.naturalWidth,
          320 / img.naturalHeight,
        );
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        setMinScale(fitScale);
        setCropScale(fitScale);
        setCropOffset({ x: 0, y: 0 });
        setAvatarSource(imageUrl);
      };
      img.onerror = () => {
        setError("Unable to read the selected image");
      };
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !avatarSource) return;

    setUploading(true);
    setSuccess("");
    setError("");

    try {
      const img = new Image();
      img.src = avatarSource;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      const cropSize = 320;
      canvas.width = cropSize;
      canvas.height = cropSize;
      const ctx = canvas.getContext("2d");

      const scale = Math.max(minScale, cropScale);
      const sourceWidth = cropSize / scale;
      const sourceHeight = cropSize / scale;
      const centerX = (img.naturalWidth - sourceWidth) / 2;
      const centerY = (img.naturalHeight - sourceHeight) / 2;
      const sourceX = clamp(
        centerX - cropOffset.x / scale,
        0,
        img.naturalWidth - sourceWidth,
      );
      const sourceY = clamp(
        centerY - cropOffset.y / scale,
        0,
        img.naturalHeight - sourceHeight,
      );

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        cropSize,
        cropSize,
      );

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9),
      );
      const formData = new FormData();
      formData.append("avatar", blob, avatarFile.name || "avatar.jpg");

      const res = await API.put("/auth/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      updateUser(res.data.user);
      setAvatarPreview(res.data.user.avatarUrl || "");
      setSuccess(res.data.message);
      resetPendingAvatar();
    } catch (err) {
      setError(err.response?.data?.message || "Image upload failed");
    }

    setUploading(false);
  };

  const handleRemoveAvatar = async () => {
    try {
      const res = await API.delete("/auth/avatar");
      updateUser(res.data.user);
      setAvatarPreview("");
      setSuccess(res.data.message);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to remove profile picture",
      );
    }
  };

  const handlePointerDown = (e) => {
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    const bounds = getCropBounds(cropScale);

    setCropOffset((prev) => ({
      x: clamp(prev.x + deltaX, -bounds.x, bounds.x),
      y: clamp(prev.y + deltaY, -bounds.y, bounds.y),
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => setDragging(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    try {
      const res = await API.put("/auth/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setSuccess(res.data.message);
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "This will permanently delete your account. Continue?",
    );
    if (!confirmed) return;

    try {
      await API.delete("/auth/account");
      logout();
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete account");
    }
  };
  const handleUpgrade = async (plan = "monthly") => {
    try {
      // 1. Create order on backend
      const { data } = await API.post("/payment/create-order", { plan });

      // 2. Open Razorpay Checkout
      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "TaskFlow Premium",
        description:
          plan === "monthly" ? "Monthly Premium Plan" : "Yearly Premium Plan",
        order_id: data.order.id,
        handler: async function (response) {
          try {
            // Send payment details to backend for verification
            await API.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success("Payment successful! You are now Premium");
            window.location.reload();
          } catch (error) {
            console.error(error);
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to start payment");
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 pt-10 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-32 relative">
            <div className="absolute -bottom-12 left-8">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center text-4xl shadow-lg border-4 border-white dark:border-gray-800 overflow-hidden relative"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "👤"
                )}
                <span className="absolute inset-x-0 bottom-0 text-[11px] text-center text-white bg-black/40 py-1 opacity-0 hover:opacity-100 transition">
                  Click to change
                </span>
              </button>
            </div>
          </div>

          <div className="pt-16 pb-8 px-8">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold dark:text-white">
                  {profile.name}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  {profile.email}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Upload profile picture
              </label>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="mb-4 text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  Remove current avatar
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />

              {avatarSource && (
                <div className="mt-5 rounded-3xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Crop your image
                    </p>
                    <button
                      type="button"
                      onClick={resetPendingAvatar}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="relative mx-auto w-full max-w-[320px] h-[320px] rounded-full bg-gray-100 dark:bg-gray-900 overflow-hidden cursor-move border-[4px] border-white shadow-inner">
                    <div className="absolute inset-0 rounded-full border-[2px] border-dashed border-indigo-400 z-10 pointer-events-none" />
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                    >
                      <img
                        src={avatarSource}
                        alt="Crop preview"
                        className="max-w-none select-none"
                        style={{
                          transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropScale})`,
                          transformOrigin: "center center",
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-500 dark:text-gray-400">
                      Zoom
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={cropScale}
                      onChange={(e) => setCropScale(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAvatarUpload}
                    disabled={uploading}
                    className="w-full bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition font-medium"
                  >
                    {uploading ? "Uploading..." : "Upload cropped image"}
                  </button>
                </div>
              )}

              {uploading && (
                <p className="text-sm text-indigo-600 mt-2">
                  Uploading image...
                </p>
              )}
            </div>

            <form onSubmit={handleProfileUpdate} className="mt-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-5 py-4 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-500 dark:text-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  className="w-full px-5 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl hover:bg-indigo-700 transition font-medium"
              >
                {loading ? "Saving..." : "Update Profile"}
              </button>
            </form>

            <form
              onSubmit={handlePasswordChange}
              className="mt-10 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-8"
            >
              <h2 className="text-xl font-semibold dark:text-white">
                Change Password
              </h2>
              <input
                type="password"
                placeholder="Current password"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full px-5 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl"
              />
              <input
                type="password"
                placeholder="New password"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, newPassword: e.target.value })
                }
                className="w-full px-5 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwords.confirmPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-5 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl"
              />
              <button
                type="submit"
                className="bg-gray-800 text-white px-8 py-3.5 rounded-2xl hover:bg-gray-900 transition font-medium"
              >
                Change Password
              </button>
            </form>

            <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="bg-red-600 text-white px-8 py-3.5 rounded-2xl hover:bg-red-700 transition font-medium"
              >
                Delete Account
              </button>

              {/* ========== PREMIUM BUTTON / STATUS ========== */}
              {user?.isPremium ? (
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-3 rounded-2xl font-medium text-center">
                  ⭐ You are a Premium Member
                  {user.premiumExpiresAt && (
                    <p className="text-sm mt-1 opacity-90">
                      Expires:{" "}
                      {new Date(user.premiumExpiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade("monthly")}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition"
                >
                  Upgrade to Premium - ₹199/month
                </button>
              )}
            </div>

            {success && (
              <p className="mt-6 text-green-600 font-medium">{success}</p>
            )}
            {error && <p className="mt-6 text-red-600 font-medium">{error}</p>}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
