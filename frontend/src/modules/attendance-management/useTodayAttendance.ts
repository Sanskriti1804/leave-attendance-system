import { useCallback, useEffect, useState } from "react";
import { getSession } from "../../../services/auth";
import {
  apiErrorMessage,
  checkInAttendance,
  checkOutAttendance,
  getMe,
  getMyAttendanceDashboard,
  getOrgSettings,
  listMyCorrections,
  type AttendanceDashboard,
  type EmployeePublic,
  type OrganisationSettings,
} from "../../../services/resources";

export function useTodayAttendance() {
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [settings, setSettings] = useState<OrganisationSettings | null>(null);
  const [dashboard, setDashboard] = useState<AttendanceDashboard | null>(null);
  const [pendingCorrections, setPendingCorrections] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [punchError, setPunchError] = useState<string | null>(null);
  const [punching, setPunching] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const session = await getSession();
      try {
        setMe(await getMe());
      } catch {
        setMe((session?.user as EmployeePublic | undefined) ?? null);
      }
      try {
        setSettings(await getOrgSettings());
      } catch (err) {
        setError(apiErrorMessage(err));
      }
      try {
        setDashboard(await getMyAttendanceDashboard());
      } catch (err) {
        setError(apiErrorMessage(err));
      }
      try {
        const corrections = await listMyCorrections("PENDING");
        setPendingCorrections(corrections.total ?? corrections.items.length);
      } catch {
        setPendingCorrections(0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const punchIn = useCallback(async () => {
    setPunchError(null);
    setPunching(true);
    try {
      await checkInAttendance();
      setDashboard(await getMyAttendanceDashboard());
    } catch (err) {
      setPunchError(apiErrorMessage(err));
    } finally {
      setPunching(false);
    }
  }, []);

  const punchOut = useCallback(async () => {
    setPunchError(null);
    setPunching(true);
    try {
      await checkOutAttendance();
      setDashboard(await getMyAttendanceDashboard());
    } catch (err) {
      setPunchError(apiErrorMessage(err));
    } finally {
      setPunching(false);
    }
  }, []);

  return {
    me,
    settings,
    dashboard,
    pendingCorrections,
    loading,
    error,
    punchError,
    punching,
    punchIn,
    punchOut,
  };
}
