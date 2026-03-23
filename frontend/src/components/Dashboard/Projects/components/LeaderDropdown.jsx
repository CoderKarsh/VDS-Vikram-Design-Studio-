import React, { useRef, useEffect } from "react";

const LeaderDropdown = ({
  options,
  selected,
  onToggle,
  show,
  setShow,
}) => {
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShow(false);
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, setShow]);
  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="border p-2 rounded w-full border-[#C9BEB8] cursor-pointer bg-white"
        onClick={() => setShow(!show)}
      >
        {selected.length > 0
          ? selected.join(", ")
          : "Select Project Leader(s) *"}
      </div>

      {show && (
        <div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto">
          {options.map((leader) => (
            <div
              key={leader}
              onMouseDown={(e) => {
                e.preventDefault();
                onToggle(leader);
              }}
              className={`p-2 cursor-pointer text-sm flex justify-between items-center ${
                selected.includes(leader)
                  ? "bg-[#F1E4DF] font-semibold"
                  : "hover:bg-gray-100"
              }`}
            >
              {leader}
              {selected.includes(leader) && (
                <span className="text-[#722F37] text-xl">✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaderDropdown;
