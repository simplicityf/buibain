import { useState, useEffect } from "react";
import { Search, ChevronDown, MoreVertical } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { deleteUser, getAllUsers } from "../../api/admin";
import { User } from "../../lib/interface";
import { alpha, Avatar } from "@mui/material";
import theme from "../../Components/theme";
import { Person } from "@mui/icons-material";
import { createChat } from "../../api/chats";
import { useUserContext } from "../../Components/ContextProvider";

const UsersTable = () => {
  const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({});
  const [filterText, setFilterText] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "email" | "plan">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const navigate = useNavigate();
  const { user, loading } = useUserContext();
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    if (user === null && !loading) {
      navigate("/login");
      return;
    }
    const fetch = async () => {
      const data = await getAllUsers();
      if (data?.success) {
        setUsers(data.data);
      } else {
        setUsers([]);
      }
    };
    fetch();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (
        !target.closest(".dropdown-menu") &&
        !target.closest(".menu-button")
      ) {
        setDropdownOpen({});
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleCreateChat = async (participants: string[]) => {
    const data = await createChat(participants);
    if (data?.success) {
      navigate(`/inbox?chatId=${data.data.id}`);
    }
  };

  const filteredUsers = users.sort((a, b) => {
    let compareA, compareB;
    switch (sortBy) {
      case "name":
        compareA = `${a.fullName}`;
        compareB = `${b.fullName}`;
        break;
      case "email":
        compareA = a.email;
        compareB = b.email;
        break;
      default:
        return 0;
    }
    return sortOrder === "asc"
      ? compareA.localeCompare(compareB)
      : compareB.localeCompare(compareA);
  });

  const handleSort = (column: "name" | "email" | "plan") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const toggleDropdown = (id: string) => {
    setDropdownOpen({ [id]: !dropdownOpen[id] });
  };
  console.log(users);
  return (
    <div className="min-h-screen to-card font-primary">
      <div className="max-w-7xl h-full mx-auto">
        <div className="bg-card h-full rounded-xl shadow-lg border border-border overflow-visible">
          <div className="p-8 min-h-[80vh]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h1 className="text-4xl font-bold font-secondary bg-gradient-to-r from-primary2 to-primary bg-clip-text text-transparent">
                  Users Management
                </h1>
                <p className="text-text2 mt-2 font-third">
                  Manage and monitor user accounts
                </p>
              </div>

              <div className="flex flex-col h-full md:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="pl-12 pr-4 py-3 w-full md:w-72 rounded-lg bg-background text-foreground border border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 font-third"
                  />
                </div>
                <div className="relative h-full flex justify-center items-center">
                  <Link
                    to="/admin/users/create"
                    className=" bg-button  flex justify-center items-center px-[1rem] rounded-full   font-primary  relative top-[5px] font-semibold h-[2.5rem]"
                  >
                    Create User
                  </Link>
                </div>
              </div>
            </div>

            {/* Fixed height container with scrollbar */}
            <div className="relative h-full border border-border rounded-lg overflow-auto">
              <table className="w-full h-max mb-[10rem]">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground font-secondary"
                      onClick={() => handleSort("name")}
                    >
                      Avatar
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground font-secondary cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        Full Name
                        {sortBy === "name" && (
                          <ChevronDown
                            className={`h-4 w-4 transform transition-transform ${
                              sortOrder === "desc" ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground font-secondary cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center gap-2">
                        Email
                        {sortBy === "email" && (
                          <ChevronDown
                            className={`h-4 w-4 transform transition-transform ${
                              sortOrder === "desc" ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground font-secondary">
                      Contact No
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground font-secondary">
                      User Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground font-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-muted/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                          }}
                          className="object-fit object-cover"
                          src={u.avatar}
                        >
                          {!u.avatar && <Person sx={{ fontSize: 40 }} />}
                        </Avatar>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {`${u.fullName}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{u.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.userType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap relative">
                        <button
                          onClick={() => toggleDropdown(u.id)}
                          className="p-2 rounded-full text-muted-foreground hover:bg-muted/50 focus:outline-none menu-button"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {dropdownOpen[u.id] && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-[9999] dropdown-menu">
                            <ul className="py-1 text-sm text-gray-700">
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  return navigate(`/admin/users/${u.id}`);
                                }}
                              >
                                User Details
                              </li>
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  handleCreateChat([
                                    u.id.toString(),
                                    user?.id.toString() || "no_id",
                                  ]);
                                }}
                              >
                                Inbox
                              </li>
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={async () => {
                                  const cfs = window.confirm(
                                    "Do you want to delete this User ?"
                                  );
                                  if (!cfs) {
                                    return;
                                  }
                                  const data = await deleteUser(u.id);
                                  if (data?.success) {
                                    const filtered = users.filter(
                                      (us) => us.id !== u.id
                                    );
                                    setUsers(filtered);
                                  }
                                }}
                              >
                                Delete User
                              </li>
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() =>
                                  console.log(`Edit u ${u.fullName}`)
                                }
                              >
                                Edit User
                              </li>
                            </ul>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersTable;
