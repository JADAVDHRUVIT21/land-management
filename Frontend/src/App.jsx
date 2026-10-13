import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import MyLands from "./pages/MyLands";
import AddLand from "./pages/AddLand";
import EditLand from "./pages/EditLand";
import LandDetail from "./pages/LandDetail";
import BrowseLands from "./pages/BrowseLands";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Contacts from "./pages/Contacts";
import HelpSupport from "./pages/HelpSupport";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Home />} />
      <Route path="/my-lands" element={<MyLands />} />

      <Route path="/add-land" element={<AddLand />} />
      <Route path="/lands/create" element={<AddLand />} />
      <Route path="/lands" element={<BrowseLands />} />

      <Route path="/edit-land/:id" element={<EditLand />} />
      <Route path="/lands/:id" element={<LandDetail />} />

      <Route path="/messages" element={<Messages />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="/help-support" element={<HelpSupport />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;
