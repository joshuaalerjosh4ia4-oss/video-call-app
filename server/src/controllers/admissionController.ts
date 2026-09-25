import { NextFunction, Request, Response } from "express";
import { createSection, getMyAdmission, listAdmissions, listSections, submitAdmission, updateAdmission } from "../services/admissionService";
import { sendSuccess } from "../utils/response";

export async function sections(_req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, await listSections()); } catch (error) { next(error); } }
export async function create(req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, await createSection(req.user!.userId, req.body), 201); } catch (error) { next(error); } }
export async function mine(req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, await getMyAdmission(req.user!.userId)); } catch (error) { next(error); } }
export async function submit(req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, await submitAdmission(req.user!.userId, req.body.sectionId, req.body.subjectSelections)); } catch (error) { next(error); } }
export async function adminList(req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, await listAdmissions(req.user!.userId)); } catch (error) { next(error); } }
export async function adminUpdate(req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, await updateAdmission(req.user!.userId, req.params.id, req.body.paymentStatus, req.body.finalize)); } catch (error) { next(error); } }