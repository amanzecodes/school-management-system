"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

type Subject = {
  id: string;
  name: string;
  classId: string;
  className?: string;
};
type Student = { id: string; name: string; regNo: string };
type ScoreRow = {
  studentId: string;
  subjectId: string;
  test1?: number | null;
  test2?: number | null;
  exam?: number | null;
};

/**
 * Demo component: Teacher result upload with filter + pagination.
 * Replace mocked data/fetches with your API hooks.
 */
export default function TeacherResultsUploadWithPagination() {
  // demo toggle - admin would control this server-side
  const [isExamOpen, setIsExamOpen] = useState<boolean>(false);

  // --- Mocked data (replace with your fetch) ---
  const [teacherSubjects] = useState<Subject[]>([
    { id: "s1", name: "English Language", classId: "c1", className: "JSS 2A" },
    { id: "s2", name: "Mathematics", classId: "c1", className: "JSS 2A" },
  ]);
  const [students] = useState<Student[]>(
    // example: many students to demonstrate pagination
    Array.from({ length: 34 }).map((_, i) => ({
      id: `u${i + 1}`,
      name: `Student ${i + 1}`,
      regNo: `REG-${String(100 + i + 1).padStart(3, "0")}`,
    }))
  );

  // existing scores (replace with backend fetch filtered by teacher/subject)
  const [existingScores, setExistingScores] = useState<ScoreRow[]>([
    { studentId: "u1", subjectId: "s1", test1: 10, test2: 14, exam: null },
  ]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    teacherSubjects[0].id
  );
  const [selectedResultType, setSelectedResultType] = useState<
    "TEST1" | "TEST2" | "EXAM"
  >("TEST1");

  // filter & pagination state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // edits and saving state
  const [edits, setEdits] = useState<Record<string, Partial<ScoreRow>>>({});
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // clear edits & reset page whenever subject or result type changes
    setEdits({});
    setPage(1);
  }, [selectedSubjectId, selectedResultType]);

  // quick lookup for existing scores per student for the selected subject
  const scoreLookup = useMemo(() => {
    const m = new Map<string, ScoreRow>();
    existingScores
      .filter((s) => s.subjectId === selectedSubjectId)
      .forEach((s) => m.set(s.studentId, s));
    return m;
  }, [existingScores, selectedSubjectId]);

  // filtered students by search term (name or regNo)
  const filteredStudents = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return students;
    return students.filter(
      (st) =>
        st.name.toLowerCase().includes(t) || st.regNo.toLowerCase().includes(t)
    );
  }, [students, searchTerm]);

  // pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const displayedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, page, pageSize]);

  // helpers to update edits (with autosave)
  const autosaveTimers = useRef<Record<string, number>>({});
  const AUTOSAVE_DELAY = 900; // ms

  function scheduleAutoSave(studentId: string) {
    const t = autosaveTimers.current[studentId];
    if (t) window.clearTimeout(t);
    autosaveTimers.current[studentId] = window.setTimeout(() => {
      if (edits[studentId]) saveStudent(studentId);
      delete autosaveTimers.current[studentId];
    }, AUTOSAVE_DELAY) as unknown as number;
  }

  useEffect(() => {
    return () => {
      // clear any pending timers on unmount
      Object.values(autosaveTimers.current).forEach((t) =>
        window.clearTimeout(t)
      );
      autosaveTimers.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function hasValidationError(studentId: string) {
    const e = edits[studentId];
    if (!e) return false;
    const bad = (v: any) =>
      v != null && !(Number.isFinite(v) && v >= 0 && v <= 100);
    return bad(e.test1) || bad(e.test2) || bad(e.exam);
  }

  function setEdit(studentId: string, field: keyof ScoreRow, value: string) {
    // allow empty -> null; otherwise parse to number and clamp 0-100
    const parsed = value === "" ? null : Number(value);
    const coerced =
      parsed === null
        ? null
        : Number.isFinite(parsed)
        ? Math.max(0, Math.min(100, parsed))
        : null;
    setEdits((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [field]: coerced },
    }));
    scheduleAutoSave(studentId);
  }

  // Save a single student's score for the selected result type
  async function saveStudent(studentId: string) {
    const payload = edits[studentId] || {};
    const existing = scoreLookup.get(studentId);
    const base: ScoreRow = {
      studentId,
      subjectId: selectedSubjectId,
      // only update the selected result type
      test1:
        selectedResultType === "TEST1"
          ? payload.test1 ?? existing?.test1 ?? null
          : existing?.test1 ?? null,
      test2:
        selectedResultType === "TEST2"
          ? payload.test2 ?? existing?.test2 ?? null
          : existing?.test2 ?? null,
      exam:
        selectedResultType === "EXAM"
          ? payload.exam ?? existing?.exam ?? null
          : existing?.exam ?? null,
    };

    // server must enforce exam lock — frontend only disables input
    if (selectedResultType === "EXAM" && !isExamOpen) return;

    // nothing meaningful to save
    const nothingToSave =
      (selectedResultType === "TEST1" && base.test1 == null) ||
      (selectedResultType === "TEST2" && base.test2 == null) ||
      (selectedResultType === "EXAM" && base.exam == null);

    if (nothingToSave) return;

    try {
      setSavingMap((s) => ({ ...s, [studentId]: true }));
      // TODO: replace with real API call / upsert endpoint
      // await api.post('/test-scores/upsert', base)
      await new Promise((r) => setTimeout(r, 350));

      // optimistic merge into existingScores
      setExistingScores((prev) => {
        const filtered = prev.filter(
          (p) =>
            !(p.studentId === studentId && p.subjectId === selectedSubjectId)
        );
        return [...filtered, base];
      });

      // clear local edit for that student
      setEdits((prev) => {
        const copy = { ...prev };
        delete copy[studentId];
        return copy;
      });
    } catch (err) {
      console.error("Save failed", err);
      // TODO: show toast/error
    } finally {
      setSavingMap((s) => ({ ...s, [studentId]: false }));
    }
  }

  // Bulk save the currently filtered page (or all - customize as needed)
  async function saveAllOnPage() {
    // build payload for displayed students
    const payload: ScoreRow[] = displayedStudents
      .map((st) => {
        const e = edits[st.id] || {};
        const ex = scoreLookup.get(st.id);
        return {
          studentId: st.id,
          subjectId: selectedSubjectId,
          test1:
            selectedResultType === "TEST1"
              ? e.test1 ?? ex?.test1 ?? null
              : ex?.test1 ?? null,
          test2:
            selectedResultType === "TEST2"
              ? e.test2 ?? ex?.test2 ?? null
              : ex?.test2 ?? null,
          exam:
            selectedResultType === "EXAM"
              ? e.exam ?? ex?.exam ?? null
              : ex?.exam ?? null,
        };
      })
      // only keep rows that actually changed/contain values for the selected type
      .filter((r) =>
        selectedResultType === "TEST1"
          ? r.test1 != null
          : selectedResultType === "TEST2"
          ? r.test2 != null
          : r.exam != null
      );

    if (payload.length === 0) return;

    try {
      const map: Record<string, boolean> = {};
      payload.forEach((p) => (map[p.studentId] = true));
      setSavingMap((s) => ({ ...s, ...map }));

      // TODO: send payload to backend bulk upsert endpoint
      await new Promise((r) => setTimeout(r, 600));

      // merge
      setExistingScores((prev) => {
        const others = prev.filter((p) => p.subjectId !== selectedSubjectId);
        return [...others, ...payload];
      });

      // clear edits for those students
      setEdits((prev) => {
        const copy = { ...prev };
        payload.forEach((p) => delete copy[p.studentId]);
        return copy;
      });
    } catch (err) {
      console.error("Bulk save failed", err);
    } finally {
      // clear saving flags for payload
      setSavingMap((s) => {
        const copy = { ...s };
        displayedStudents.forEach((st) => delete copy[st.id]);
        return copy;
      });
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Upload Results
          </h2>
          <p className="text-sm text-gray-600">
            Choose result type and enter scores for your students.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-700">Exam open:</label>
          <button
            onClick={() => setIsExamOpen((s) => !s)}
            className={`px-3 py-1 text-sm border ${
              isExamOpen
                ? "bg-green-50 border-green-300"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            {isExamOpen ? "Open" : "Closed"}
          </button>
        </div>
      </div>

      {/* toolbar: subject, result type, search, save all on page */}
      <div className="bg-white border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
        <label className="text-sm text-gray-700 w-28">Subject</label>
        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="border border-gray-200 px-3 py-2"
        >
          {teacherSubjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} • {s.className}
            </option>
          ))}
        </select>

        <label className="text-sm text-gray-700">Result</label>
        <select
          value={selectedResultType}
          onChange={(e) => setSelectedResultType(e.target.value as any)}
          className="border border-gray-200 px-3 py-2"
        >
          <option value="TEST1">Test 1</option>
          <option value="TEST2">Test 2</option>
          <option value="EXAM">Exam</option>
        </select>

        <div className="ml-auto flex items-center gap-3 w-full sm:w-auto">
          <input
            placeholder="Search name or reg no"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="border border-gray-200  px-3 py-2 w-full sm:w-64"
          />

          <button
            onClick={saveAllOnPage}
            className="px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700 whitespace-nowrap"
          >
            Save Page
          </button>
        </div>
      </div>

      {/* main area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {displayedStudents.map((st) => {
            const existing = scoreLookup.get(st.id);
            const edit = edits[st.id] || {};
            const saving = !!savingMap[st.id];

            const displayValue = () => {
              if (selectedResultType === "TEST1")
                return edit.test1 ?? existing?.test1 ?? "";
              if (selectedResultType === "TEST2")
                return edit.test2 ?? existing?.test2 ?? "";
              return edit.exam ?? existing?.exam ?? "";
            };

            const handleChange = (v: string) => {
              const field =
                selectedResultType === "TEST1"
                  ? "test1"
                  : selectedResultType === "TEST2"
                  ? "test2"
                  : "exam";
              setEdit(st.id, field as any, v);
            };

            return (
              <div
                key={st.id}
                className="bg-white border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {st.name}
                      </div>
                      <div className="text-xs text-gray-500">{st.regNo}</div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-xs text-gray-500">
                        {selectedResultType === "TEST1"
                          ? "Test 1"
                          : selectedResultType === "TEST2"
                          ? "Test 2"
                          : "Exam"}
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          value={displayValue() as any}
                          onChange={(e) => handleChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (!hasValidationError(st.id))
                                saveStudent(st.id);
                              else
                                toast.error(
                                  "Please fix invalid scores before saving"
                                );
                            }
                          }}
                          className={`w-20 sm:w-24 border rounded-md px-2 py-1 text-sm ${
                            selectedResultType === "EXAM" && !isExamOpen
                              ? "bg-gray-50 text-gray-300 border-gray-100"
                              : "border-gray-200"
                          } ${
                            hasValidationError(st.id)
                              ? "ring-2 ring-red-300"
                              : ""
                          }`}
                          placeholder="-"
                          disabled={
                            selectedResultType === "EXAM" && !isExamOpen
                          }
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (hasValidationError(st.id)) {
                            toast.error("Fix invalid score before saving");
                            return;
                          }
                          saveStudent(st.id);
                        }}
                        disabled={saving}
                        className="mt-2 sm:mt-0 ml-0 sm:ml-3 px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 whitespace-nowrap"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* empty state for no results */}
          {displayedStudents.length === 0 && (
            <div className="bg-white border border-gray-200 p-6 text-center text-gray-500">
              No students match the current filter.
            </div>
          )}

          {/* pagination controls (centered with caret buttons, responsive) */}
          <div className="mt-4 flex flex-col items-center md:flex-row md:justify-between gap-3">
            {/* Page size (on left for md+, below on mobile) */}
            <div className="flex items-center gap-2 text-sm text-gray-600 order-2 md:order-1">
              <label>Page size</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="border px-2 py-1"
              >
                {[5, 10, 15, 25].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Centered pagination with carets */}
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded px-3 py-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="p-1 rounded disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Page</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={page}
                    onChange={(e) => {
                      const v = Number(e.target.value || 1);
                      if (v >= 1 && v <= totalPages) setPage(v);
                    }}
                    className="w-20 text-center border rounded px-2 py-1"
                  />
                  <span className="text-sm text-gray-600">of {totalPages}</span>
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                  className="p-1 rounded disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* sidebar */}
        <aside className="space-y-3">
          <div className="bg-white border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Quick summary
            </h4>
            <div className="text-sm text-gray-600 mb-1">
              Subject:{" "}
              <span className="font-medium text-gray-800">
                {teacherSubjects.find((s) => s.id === selectedSubjectId)?.name}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-1">
              Class:{" "}
              <span className="font-medium text-gray-800">
                {
                  teacherSubjects.find((s) => s.id === selectedSubjectId)
                    ?.className
                }
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Students (filtered):{" "}
              <span className="font-medium text-gray-800">
                {filteredStudents.length}
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Recent submissions
            </h4>
            <div className="space-y-2 max-h-48 overflow-auto">
              {existingScores
                .filter((s) => s.subjectId === selectedSubjectId)
                .slice(-6)
                .map((s) => (
                  <div
                    key={s.studentId}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="text-gray-800">
                      {students.find((st) => st.id === s.studentId)?.name ??
                        s.studentId}
                    </div>
                    <div className="text-gray-600">
                      {s.test1 ?? "-"} / {s.test2 ?? "-"} / {s.exam ?? "-"}
                    </div>
                  </div>
                ))}
              {existingScores.filter((s) => s.subjectId === selectedSubjectId)
                .length === 0 && (
                <div className="text-sm text-gray-500">No submissions yet</div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
