"use server";

import { requireSuperAdminAction } from "@/lib/auth/super-admin";
import {
  pingIntelliConnection,
  type IntelliConnectionStatus,
} from "@/lib/intelli/partner-client";

/**
 * Super-admin: live health-check of the Intelli Partner connection.
 * Re-runs the server→Intelli ping so the admin can confirm the ik_ key and
 * edge reachability without redeploying.
 */
export async function testIntelliConnectionAction(): Promise<IntelliConnectionStatus> {
  await requireSuperAdminAction();
  return pingIntelliConnection();
}
