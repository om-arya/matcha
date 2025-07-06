import { NavLink } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul className="nav-links">
        <li>
          <NavLink
            to="/graph"
            className={({ isActive }) =>
              `nav-link${isActive ? " active" : ""}`
            }
          >
            Graph Comparison
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/prompt"
            className={({ isActive }) =>
              `nav-link${isActive ? " active" : ""}`
            }
          >
            Prompt Comparison
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;