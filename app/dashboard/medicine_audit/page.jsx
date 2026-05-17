"use client";

import {
  CalendarDays,
  Pill,
  Truck,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Activity,
  Calendar,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function MedicineAudit() {
  const [medicines, setMedicines] = useState([]);
  const [mmuDetails, setMmuDetails] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [quantities, setQuantities] = useState({});
  const [statistics, setStatistics] = useState({
    daily: { mmuAudited: 0, medicineCount: 0, auditCount: 0 },
    monthly: { mmuAudited: 0, medicineCount: 0, auditCount: 0 },
  });
  const [formData, setFormData] = useState({
    audit_date: "",
    mmu_name: "",
    vehicle_reg_number: "",
    apm_name: "",
    nodal_officer_name: "",
    mmu_doctor_name: "",
    mmu_pharmacist_name: "",
    vendor_name: "",
    phase: "",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await Promise.all([
          fetch("/api/medicines"),
          fetch("/api/mmu_details"),
          fetch("/api/audit/statistics"),
        ]);
        const medicinesData = await response[0].json();
        const mmuData = await response[1].json();
        const statsData = await response[2].json();

        // Check for saved draft before setting state
        const draftString = localStorage.getItem("medicine_audit_draft");
        let draftFormData = null;
        if (draftString) {
          try {
            const draft = JSON.parse(draftString);
            if (draft && draft.formData) {
              draftFormData = draft.formData;
            }
          } catch (e) {
            console.error("Error loading draft", e);
          }
        }

        setMedicines(Array.isArray(medicinesData) ? medicinesData : []);
        setMmuDetails(Array.isArray(mmuData) ? mmuData : []);
        if (statsData && statsData.success) {
          setStatistics(statsData);
        }
        if (draftFormData) {
          setFormData(draftFormData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setMessage({
          type: "error",
          text: "We had trouble loading the required data. Please refresh the page or check your internet connection.",
        });
      } finally {
        setIsFetching(false);
      }
    }
    fetchData();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "mmu_name") {
      const selectedMmuData = mmuDetails.find((mmu) => mmu.mmu_name === value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        vendor_name: selectedMmuData?.mmu_vendor_name || "",
        phase: selectedMmuData?.phase || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  const handleQuantityChange = (index, value) => {
    setQuantities((prev) => ({
      ...prev,
      [index]: value === "" ? "" : parseInt(value, 10),
    }));
  };

  // Initialize quantities to empty strings for all medicines when medicines list loads to avoid auto-filling with 0
  useEffect(() => {
    if (Array.isArray(medicines) && medicines.length > 0) {
      // Load drafted quantities if available
      const draftString = localStorage.getItem("medicine_audit_draft");
      let draftQuantities = null;
      if (draftString) {
        try {
          const draft = JSON.parse(draftString);
          if (draft && draft.quantities) {
            draftQuantities = draft.quantities;
          }
        } catch (e) {
          console.error("Error loading draft quantities", e);
        }
      }

      const init = {};
      medicines.forEach((_, i) => {
        init[i] =
          draftQuantities && draftQuantities[i] !== undefined
            ? draftQuantities[i]
            : "";
      });
      setQuantities(init);
    }
  }, [medicines]);

  // Auto-save form data and quantities whenever they change
  useEffect(() => {
    // Only save if we have finished fetching data, so we don't overwrite with empty initial states
    if (!isFetching) {
      const draft = { formData, quantities };
      localStorage.setItem("medicine_audit_draft", JSON.stringify(draft));
    }
  }, [formData, quantities, isFetching]);

  const filteredMedicines = medicines
    .map((medicine, index) => ({ medicine, index }))
    .filter(
      ({ medicine }) =>
        medicine.medicine_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        medicine.drug_code.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  const handleQuantityKeyDown = (e, index, viewType) => {
    // Intercept 'Enter' key
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent accidental form submission

      const currentFilteredIndex = filteredMedicines.findIndex(
        (m) => m.index === index,
      );
      const nextFiltered = filteredMedicines[currentFilteredIndex + 1];

      if (nextFiltered) {
        const nextInput = document.getElementById(
          `qty-${viewType}-${nextFiltered.index}`,
        );
        if (nextInput) {
          nextInput.focus();
          nextInput.select(); // Highlight the text so they can overwrite easily
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Collect medicine data with quantities (zeros allowed)
      // Ensure quantities exist for all medicines
      if (!Array.isArray(medicines) || medicines.length === 0) {
        setMessage({
          type: "error",
          text: "We couldn't find any medicines to audit. Please wait for the list to load or refresh the page.",
        });
        setLoading(false);
        return;
      }

      const medicinesData = medicines.map((medicine, index) => ({
        drug_code: medicine.drug_code,
        medicine_name: medicine.medicine_name,
        physical_quantity: quantities[index] ?? 0,
      }));

      // Verify every medicine has a valid quantity entered
      const hasEmptyQuantity = medicines.some(
        (_, index) =>
          quantities[index] === "" || quantities[index] === undefined,
      );

      if (hasEmptyQuantity) {
        setMessage({
          type: "error",
          text: "Please make sure to enter a quantity for every medicine. You can enter 0 if a medicine is out of stock.",
        });
        setLoading(false);
        return;
      }

      // Validate all required fields
      if (
        !formData.audit_date ||
        !formData.mmu_name ||
        !formData.vehicle_reg_number ||
        !formData.apm_name ||
        !formData.nodal_officer_name ||
        !formData.mmu_doctor_name ||
        !formData.mmu_pharmacist_name ||
        !formData.vendor_name ||
        !formData.phase
      ) {
        setMessage({
          type: "error",
          text: "Please double-check the form and fill in all the required details before submitting.",
        });
        setLoading(false);
        return;
      }

      const submitData = {
        ...formData,
        medicines: medicinesData,
      };

      const response = await fetch("/api/audit/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: "success",
          text: "Audit data submitted successfully!",
        });

        // Clear draft from local storage after successful submission
        localStorage.removeItem("medicine_audit_draft");

        // Reset form
        setFormData({
          audit_date: "",
          mmu_name: "",
          vehicle_reg_number: "",
          apm_name: "",
          nodal_officer_name: "",
          mmu_doctor_name: "",
          mmu_pharmacist_name: "",
          vendor_name: "",
          phase: "",
        });
        const resetQuantities = {};
        medicines.forEach((_, i) => {
          resetQuantities[i] = "";
        });
        setQuantities(resetQuantities);
      } else {
        setMessage({
          type: "error",
          text:
            result.message ||
            "We couldn't save your audit at this time. Please try again later.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({
        type: "error",
        text: "Oops! Something went wrong while saving your audit. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800"></div>
        <p className="mt-4 text-lg font-medium text-slate-600">
          Loading audit data...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-4 sm:px-5 md:px-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-5 w-full max-w-7xl sm:mb-8"
      >
        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl lg:text-4xl">
          Medicine Audit Form
        </h1>

        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Mobile Medical Unit Medicine Physical Audit
        </p>
      </motion.div>

      {/* Statistics Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-6 grid w-full max-w-7xl grid-cols-1 gap-4 sm:mb-8 md:grid-cols-3"
      >
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Today's Audits</p>
            <p className="text-2xl font-bold text-slate-800">
              {statistics.daily.auditCount}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-green-50 p-3 text-green-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Monthly Audits</p>
            <p className="text-2xl font-bold text-slate-800">
              {statistics.monthly.auditCount}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">
              MMUs Audited (Month)
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {statistics.monthly.mmuAudited}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:rounded-3xl"
      >
        {/* Top Section */}
        <div className="bg-linear-to-r from-slate-900 to-slate-700 px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            Audit Details
          </h2>
        </div>

        <form className="p-4 sm:p-6 lg:p-8" onSubmit={handleSubmit}>
          {/* Message Display */}
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 rounded-xl p-4 flex items-center gap-3 ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle size={20} className="shrink-0" />
              ) : (
                <AlertCircle size={20} className="shrink-0" />
              )}
              <span className="font-medium">{message.text}</span>
            </motion.div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:gap-6">
            {/* Date */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Audit Date
              </label>

              <div className="relative">
                <CalendarDays
                  size={18}
                  className="absolute left-4 top-4 text-slate-400"
                />

                <input
                  type="date"
                  id="audit_date"
                  name="audit_date"
                  value={formData.audit_date}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-slate-700 sm:rounded-2xl"
                />
              </div>
            </div>

            {/* MMU Name */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                MMU Name
              </label>

              <select
                id="mmu_name"
                name="mmu_name"
                value={formData.mmu_name}
                onChange={handleFormChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-700 sm:rounded-2xl"
              >
                <option value="">Select MMU</option>
                {mmuDetails.map((mmu) => (
                  <option key={mmu.mmu_name} value={mmu.mmu_name}>
                    {mmu.mmu_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Registration */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Vehicle Registration Number
              </label>

              <div className="relative">
                <Truck
                  size={18}
                  className="absolute left-4 top-4 text-slate-400"
                />

                <input
                  type="text"
                  id="vehicle_reg_number"
                  name="vehicle_reg_number"
                  value={formData.vehicle_reg_number}
                  onChange={handleFormChange}
                  placeholder="CG04 XXXX"
                  required
                  className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-slate-700 sm:rounded-2xl"
                />
              </div>
            </div>

            {/* APM Name */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                APM Name
              </label>

              <input
                type="text"
                id="apm_name"
                name="apm_name"
                value={formData.apm_name}
                onChange={handleFormChange}
                placeholder="Enter APM name"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-700 sm:rounded-2xl"
              />
            </div>

            {/* Nodal Officer */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Nodal Officer Name
              </label>

              <input
                type="text"
                id="nodal_officer_name"
                name="nodal_officer_name"
                value={formData.nodal_officer_name}
                onChange={handleFormChange}
                placeholder="Enter officer name"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-700 sm:rounded-2xl"
              />
            </div>

            {/* Doctor Name */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                MMU Doctor Name
              </label>

              <input
                type="text"
                id="mmu_doctor_name"
                name="mmu_doctor_name"
                value={formData.mmu_doctor_name}
                onChange={handleFormChange}
                placeholder="Doctor name"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-700 sm:rounded-2xl"
              />
            </div>

            {/* Pharmacist */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                MMU Pharmacist Name
              </label>

              <input
                type="text"
                id="mmu_pharmacist_name"
                name="mmu_pharmacist_name"
                value={formData.mmu_pharmacist_name}
                onChange={handleFormChange}
                placeholder="Pharmacist name"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-700 sm:rounded-2xl"
              />
            </div>

            {/* Vendor */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Vendor Name
              </label>

              <input
                type="text"
                id="vendor_name"
                name="vendor_name"
                value={formData.vendor_name}
                placeholder="Vendor name"
                required
                readOnly
                className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-700 outline-none sm:rounded-2xl"
              />
            </div>

            {/* Phase */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Phase
              </label>

              <input
                type="text"
                id="phase"
                name="phase"
                value={formData.phase}
                placeholder="Phase name"
                required
                readOnly
                className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-700 outline-none sm:rounded-2xl"
              />
            </div>
          </div>

          {/* Table Section */}
          <div className="mt-10 border-t border-slate-200 pt-8 sm:mt-12 sm:pt-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-900 p-2.5 text-white shadow-sm">
                  <Pill size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
                    Medicine Inventory
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Carefully verify and enter the physical quantities.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search medicines..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition-all hover:bg-slate-50 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  />
                </div>
                <div className="inline-flex w-max items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700">
                  Total Items: {medicines.length}
                </div>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-inner md:rounded-3xl md:bg-white md:shadow-sm">
              {filteredMedicines.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center sm:p-12">
                  <div className="rounded-full bg-slate-100 p-4 mb-4">
                    <Search size={32} className="text-slate-400" />
                  </div>
                  <p className="text-lg font-medium text-slate-800">
                    No medicines found
                  </p>
                  <p className="text-slate-500 mt-1">
                    Try adjusting your search criteria
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile View (< md) */}
                  <div className="flex flex-col gap-3 p-3 md:hidden">
                    {filteredMedicines.map(({ medicine, index }) => (
                      <div
                        key={index}
                        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all focus-within:border-transparent focus-within:ring-2 focus-within:ring-slate-800"
                      >
                        <div className="absolute left-0 top-0 h-full w-1.5 bg-slate-800"></div>
                        <div className="mb-3 flex items-center justify-between pl-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Item {index + 1}
                          </span>
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 ring-1 ring-inset ring-slate-500/20">
                            {medicine.drug_code}
                          </span>
                        </div>
                        <div className="mb-4 pl-2">
                          <h3 className="text-base font-bold leading-tight text-slate-800">
                            {medicine.medicine_name}
                          </h3>
                        </div>
                        <div className="-mb-4 -mx-4 flex items-center justify-between bg-slate-50/80 px-4 pb-4 pt-4 pl-6 border-t border-slate-100">
                          <label className="text-sm font-semibold text-slate-700">
                            Physical Qty:
                          </label>
                          <input
                            id={`qty-mob-${index}`}
                            type="number"
                            placeholder="0"
                            min="0"
                            value={quantities[index] ?? ""}
                            onChange={(e) =>
                              handleQuantityChange(index, e.target.value)
                            }
                            onKeyDown={(e) =>
                              handleQuantityKeyDown(e, index, "mob")
                            }
                            className="w-28 rounded-xl border-2 border-slate-200 px-3 py-2.5 text-center text-lg font-bold text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tablet/Desktop View (>= md) */}
                  <table className="hidden w-full border-collapse md:table">
                    <thead className="sticky top-0 z-20 bg-slate-900 text-white shadow-md">
                      <tr>
                        <th className="w-16 px-4 py-4 text-center font-semibold">
                          #
                        </th>
                        <th className="w-32 px-4 py-4 text-left font-semibold">
                          Drug Code
                        </th>
                        <th className="px-4 py-4 text-left font-semibold">
                          Medicine Name
                        </th>
                        <th className="w-56 px-4 py-4 text-center font-semibold">
                          Physical Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredMedicines.map(({ medicine, index }) => (
                        <tr
                          key={index}
                          className="group transition-colors hover:bg-slate-50"
                        >
                          <td className="px-4 py-4 text-center text-sm font-medium text-slate-500">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-inset ring-slate-500/20">
                              {medicine.drug_code}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="block text-base font-bold leading-tight text-slate-800">
                              {medicine.medicine_name}
                            </span>
                          </td>
                          <td className="bg-slate-50/30 px-4 py-3 text-center transition-colors group-hover:bg-slate-100/50">
                            <input
                              id={`qty-desk-${index}`}
                              type="number"
                              placeholder="0"
                              min="0"
                              value={quantities[index] ?? ""}
                              onChange={(e) =>
                                handleQuantityChange(index, e.target.value)
                              }
                              onKeyDown={(e) =>
                                handleQuantityKeyDown(e, index, "desk")
                              }
                              className="mx-auto block w-32 rounded-xl border-2 border-slate-200 px-3 py-2.5 text-center text-lg font-bold text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 sm:w-auto sm:rounded-2xl ${
                loading
                  ? "bg-slate-500 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800 hover:shadow-xl"
              }`}
            >
              {loading ? "Submitting..." : "Submit Audit"}
            </button>
            {!loading && !isFetching && (
              <span className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 sm:justify-start">
                <CheckCircle size={16} className="text-emerald-500" />
                Draft auto-saved locally
              </span>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
