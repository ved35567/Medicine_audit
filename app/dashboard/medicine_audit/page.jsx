"use client";

import { CalendarDays, Pill, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function MedicineAudit() {
  const [medicines, setMedicines] = useState([]);
  const [mmuDetails, setMmuDetails] = useState([]);
  const [selectedMmuName, setSelectedMmuName] = useState("");
  const selectedMmu = mmuDetails.find((mmu) => mmu.mmu_name === selectedMmuName);
  

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await Promise.all([fetch("/api/medicines"), fetch("/api/mmu_details")]);
        const medicines = await response[0].json();
        const mmuData = await response[1].json();
        setMedicines(Array.isArray(medicines) ? medicines : []);
        setMmuDetails(Array.isArray(mmuData) ? mmuData : []);
        console.log("Fetched medicines:", medicines);
        console.log("Fetched MMU details:", mmuData);
      } catch (error) {
        console.error("Error fetching medicines:", error);
      }
    }
    fetchData();
  }, []);
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

      {/* Form Card */}
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

        <form className="p-4 sm:p-6 lg:p-8">
          {/* Form Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-6">
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
                  id="date"
                  name="date"
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
                value={selectedMmuName}
                onChange={(event) => setSelectedMmuName(event.target.value)}
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
                  placeholder="CG04 XXXX"
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
                placeholder="Enter APM name"
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
                placeholder="Enter officer name"
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
                placeholder="Doctor name"
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
                placeholder="Pharmacist name"
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
                value={selectedMmu?.mmu_vendor_name || ""}
                placeholder="Vendor name"
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
                value={selectedMmu?.phase || ""}
                placeholder="Phase name"
                readOnly
                className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-700 outline-none sm:rounded-2xl"
              />
            </div>
          </div>

          {/* Table Section */}
          <div className="mt-8 sm:mt-10">
            <div className="mb-4 flex items-center gap-2 sm:mb-5">
              <Pill className="shrink-0 text-slate-700" size={22} />

              <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
                Medicine Audit List
              </h2>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 sm:max-h-[32rem] sm:rounded-3xl">
              <table className="w-full min-w-[36rem] sm:min-w-[42rem]">
                <thead className="sticky top-0 z-10 bg-slate-900 text-white">
                  <tr>
                    <th className="px-3 py-3 text-left text-sm sm:px-5 sm:py-4 sm:text-base">S.No</th>
                    <th className="px-3 py-3 text-left text-sm sm:px-5 sm:py-4 sm:text-base">Drug Code</th>
                    <th className="px-3 py-3 text-left text-sm sm:px-5 sm:py-4 sm:text-base">Medicine Name</th>
                    <th className="px-3 py-3 text-left text-sm sm:px-5 sm:py-4 sm:text-base">Physical Quantity</th>
                  </tr>
                </thead>

                <tbody>
                  {medicines.map((medicine, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-200 hover:bg-slate-50 transition"
                    >
                      <td className="px-3 py-3 text-sm font-medium sm:px-5 sm:py-4 sm:text-base">{index + 1}</td>

                      <td className="px-3 py-3 text-sm sm:px-5 sm:py-4 sm:text-base">{medicine.drug_code}</td>

                      <td className="px-3 py-3 text-sm sm:px-5 sm:py-4 sm:text-base">{medicine.medicine_name}</td>

                      <td className="px-3 py-3 sm:px-5 sm:py-4">
                        <input
                          type="number"
                          placeholder="Enter qty"
                          min="0"
                          required
                          className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-700 sm:w-32 sm:text-base"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:bg-slate-800 hover:shadow-xl sm:w-auto sm:rounded-2xl"
            >
              Submit Audit
            </button>

            <button
              type="button"
              className="w-full rounded-xl bg-green-600 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:bg-green-700 hover:shadow-xl sm:w-auto sm:rounded-2xl"
            >
              Download Excel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
