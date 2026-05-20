/**
 * NestJS Redis microservice message & event pattern constants.
 * Format: '<service>:<action>'
 * MSG_ = request/response (@MessagePattern)
 * EVT_ = fire-and-forget (@EventPattern)
 */

// ── Auth service ─────────────────────────────────────────────────────────────
export const MSG_AUTH_LOGIN       = 'auth:login';
export const MSG_AUTH_REFRESH     = 'auth:refresh';
export const MSG_AUTH_LOGOUT      = 'auth:logout';
export const MSG_AUTH_VALIDATE    = 'auth:validate';   // gateway: validate JWT → user payload

// ── Users service (part of svc-auth) ─────────────────────────────────────────
export const MSG_USERS_LIST               = 'users:list';
export const MSG_USERS_FIND_ONE           = 'users:findOne';
export const MSG_USERS_CREATE             = 'users:create';
export const MSG_USERS_UPDATE             = 'users:update';
export const MSG_USERS_UPDATE_PERMISSIONS = 'users:updatePermissions';
export const MSG_USERS_UPLOAD_AVATAR      = 'users:uploadAvatar';

// ── Properties service ────────────────────────────────────────────────────────
export const MSG_PROPS_LIST              = 'properties:list';
export const MSG_PROPS_FIND_ONE          = 'properties:findOne';
export const MSG_PROPS_CREATE            = 'properties:create';
export const MSG_PROPS_UPDATE            = 'properties:update';
export const MSG_PROPS_DELETE            = 'properties:delete';
export const MSG_PROPS_UPDATE_VISIBILITY = 'properties:updateVisibility';
export const MSG_PROPS_PDF               = 'properties:pdf';
export const MSG_PROPS_GET_MATCHES       = 'properties:getMatches';
export const MSG_PROPS_PHOTO_UPLOAD      = 'properties:photoUpload';
export const MSG_PROPS_PHOTO_DELETE      = 'properties:photoDelete';
export const MSG_PROPS_PHOTO_REORDER     = 'properties:photoReorder';

// ── Owners service (part of svc-properties) ──────────────────────────────────
export const MSG_OWNERS_LIST     = 'owners:list';
export const MSG_OWNERS_FIND_ONE = 'owners:findOne';
export const MSG_OWNERS_CREATE   = 'owners:create';
export const MSG_OWNERS_UPDATE   = 'owners:update';
export const MSG_OWNERS_DELETE   = 'owners:delete';

// ── Demands service ───────────────────────────────────────────────────────────
export const MSG_DEMANDS_LIST          = 'demands:list';
export const MSG_DEMANDS_FIND_ONE      = 'demands:findOne';
export const MSG_DEMANDS_CREATE        = 'demands:create';
export const MSG_DEMANDS_UPDATE        = 'demands:update';
export const MSG_DEMANDS_DELETE        = 'demands:delete';
export const MSG_DEMANDS_UPDATE_STATUS = 'demands:updateStatus';
export const MSG_DEMANDS_GET_MATCHES   = 'demands:getMatches';
export const MSG_DEMANDS_GET_ACTIVITY  = 'demands:getActivity';
export const MSG_DEMANDS_ADD_ACTIVITY  = 'demands:addActivity';

// ── Deals service ─────────────────────────────────────────────────────────────
export const MSG_DEALS_LIST    = 'deals:list';
export const MSG_DEALS_FIND_ONE = 'deals:findOne';
export const MSG_DEALS_CREATE  = 'deals:create';
export const MSG_DEALS_UPDATE  = 'deals:update';
export const MSG_DEALS_DELETE  = 'deals:delete';
export const MSG_DEALS_SUMMARY = 'deals:summary';

// ── Matching service ──────────────────────────────────────────────────────────
export const MSG_MATCHING_GET_DEMAND_MATCHES   = 'matching:getDemandMatches';
export const MSG_MATCHING_GET_PROPERTY_MATCHES = 'matching:getPropertyMatches';

// ── Notifications service ─────────────────────────────────────────────────────
export const MSG_NOTIF_LIST       = 'notifications:list';
export const MSG_NOTIF_MARK_READ  = 'notifications:markRead';
export const MSG_NOTIF_MARK_ALL   = 'notifications:markAll';
export const MSG_NOTIF_SUBSCRIBE  = 'notifications:subscribe';

// ── Audit log service (part of svc-notifications) ────────────────────────────
export const MSG_AUDIT_LIST = 'audit:list';

// ── Residential Complexes (part of svc-properties) ───────────────────────────
export const MSG_COMPLEXES_LIST         = 'complexes:list';
export const MSG_COMPLEXES_FIND_ONE     = 'complexes:findOne';
export const MSG_COMPLEXES_CREATE       = 'complexes:create';
export const MSG_COMPLEXES_UPDATE       = 'complexes:update';
export const MSG_COMPLEXES_DELETE       = 'complexes:delete';
export const MSG_COMPLEXES_PHOTO_UPLOAD = 'complexes:photoUpload';
export const MSG_COMPLEXES_PHOTO_DELETE = 'complexes:photoDelete';

// ── Tasks (part of svc-demands) ──────────────────────────────────────────────
export const MSG_TASKS_LIST         = 'tasks:list';
export const MSG_TASKS_FIND_ONE     = 'tasks:findOne';
export const MSG_TASKS_CREATE       = 'tasks:create';
export const MSG_TASKS_UPDATE       = 'tasks:update';
export const MSG_TASKS_DELETE       = 'tasks:delete';
export const MSG_TASKS_GET_COMMENTS = 'tasks:getComments';
export const MSG_TASKS_ADD_COMMENT  = 'tasks:addComment';

// ── Analytics (part of svc-demands) ──────────────────────────────────────────
export const MSG_ANALYTICS_DASHBOARD = 'analytics:dashboard';
export const MSG_ANALYTICS_REPORTS   = 'analytics:reports';

// ── Complex Apartments & Documents (part of svc-properties) ──────────────────
export const MSG_COMPLEXES_APARTMENT_LIST   = 'complexes:apartment.list';
export const MSG_COMPLEXES_APARTMENT_CREATE = 'complexes:apartment.create';
export const MSG_COMPLEXES_APARTMENT_UPDATE = 'complexes:apartment.update';
export const MSG_COMPLEXES_APARTMENT_DELETE = 'complexes:apartment.delete';
export const MSG_COMPLEXES_DOCUMENT_LIST    = 'complexes:document.list';
export const MSG_COMPLEXES_DOCUMENT_UPLOAD  = 'complexes:document.upload';
export const MSG_COMPLEXES_DOCUMENT_DELETE  = 'complexes:document.delete';

// ── Entity Events ─────────────────────────────────────────────────────────────
export const MSG_PROPS_GET_EVENTS   = 'properties:getEvents';
export const MSG_DEMANDS_GET_EVENTS = 'demands:getEvents';

// ── WebAuthn / Passkey (part of svc-auth) ────────────────────────────────────
export const MSG_PASSKEY_REG_OPTIONS  = 'passkey:regOptions';
export const MSG_PASSKEY_REG_VERIFY   = 'passkey:regVerify';
export const MSG_PASSKEY_AUTH_OPTIONS = 'passkey:authOptions';
export const MSG_PASSKEY_AUTH_VERIFY  = 'passkey:authVerify';

// ─────────────────────────────────────────────────────────────────────────────
// Event patterns (fire-and-forget, @EventPattern)
// ─────────────────────────────────────────────────────────────────────────────

export const EVT_PROPERTY_CREATED     = 'event:property.created';
export const EVT_PROPERTY_UPDATED     = 'event:property.updated';
export const EVT_PROPERTY_PRICE_DROP  = 'event:property.priceDrop';
export const EVT_DEMAND_CREATED       = 'event:demand.created';
export const EVT_DEMAND_UPDATED       = 'event:demand.updated';
export const EVT_NOTIFICATION_SEND    = 'event:notification.send';
export const EVT_AUDIT_LOG            = 'event:audit.log';
