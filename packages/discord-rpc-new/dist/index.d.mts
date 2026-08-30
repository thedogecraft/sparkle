import { EventEmitter } from "node:events";
//#region src/types/activities.d.ts
/**
 * Timestamps for an activity.
 */
interface Timestamps {
  start?: number;
  end?: number;
}
/**
 * Assets for an activity.
 */
interface Assets {
  large_image?: string;
  large_text?: string;
  large_url?: string;
  small_image?: string;
  small_text?: string;
  small_url?: string;
}
/**
 * Party information for an activity.
 */
interface Party {
  id?: string;
  /**
   * size[0] is current size, size[1] is max size
   * Example: [1, 5] for "1 of 5"
   */
  size?: [number, number];
}
/**
 * Secrets for an activity.
 */
interface Secrets {
  join?: string;
  spectate?: string;
  match?: string;
}
/**
 * Enum for activity types.
 *
 * When using SET_ACTIVITY, the activity object is limited to a type of Playing (0), Listening (2), Watching (3), or Competing (5).
 */
declare enum ActivityType {
  Playing = 0,
  Streaming = 1,
  Listening = 2,
  Watching = 3,
  Custom = 4,
  Competing = 5
}
/**
 * Button structure for an activity.
 */
interface Button {
  label: string;
  url: string;
}
/**
 * Payload structure for an activity.
 */
interface ActivityPayload {
  type?: ActivityType | number;
  state?: string;
  state_url?: string;
  details?: string;
  details_url?: string;
  timestamps?: Timestamps;
  assets?: Assets;
  party?: Party;
  secrets?: Secrets;
  instance?: boolean;
  buttons?: Button[];
}
/**
 * Enum for lobby types.
 */
declare enum LobbyType {
  PRIVATE = 1,
  PUBLIC = 2
}
/**
 * Enum for relationship types.
 */
declare enum RelationshipType {
  NONE = 0,
  FRIEND = 1,
  BLOCKED = 2,
  PENDING_INCOMING = 3,
  PENDING_OUTGOING = 4,
  IMPLICIT = 5
}
//#endregion
//#region src/types/client.d.ts
/**
 * Path data for the socket connection
 */
interface PathData {
  /**
   * Platforms that use this path format
   */
  platform: NodeJS.Platform[];
  /**
   * Format to get the socket path from the pipe index
   * @param index Pipe index (0-9)
   * @returns Path to the socket
   * @example
   * (index) => `\\\\?\\pipe\\discord-ipc-${index}`
   */
  format: (index: number) => string;
}
/**
 * Options for the Client constructor
 */
type ClientOptions = {
  /**
   * Custom path list for the socket connection
   */
  pathList?: PathData[];
  /**
   * Maximum number of automatic reconnect attempts before the client gives up
   * and emits 'reconnect_failed'. Defaults to Infinity (previous behavior).
   */
  maxReconnectAttempts?: number;
};
/**
 * Response from READY event
 */
type ReadyResponse = {
  v: number;
  config: {
    cdn_host: string;
    api_endpoint: string;
    environment: string;
  };
  user: User;
};
/**
 * User object structure
 */
type User = {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  avatar_decoration_data?: {
    asset: string;
    skuId: string;
  };
  bot?: boolean;
  flags?: number;
  premium_type?: number;
};
/**
 * Response from authorize method
 */
type AuthorizeResponse = {
  code: string;
};
/**
 * Response from authenticate method
 */
type AuthenticateResponse = {
  application: {
    id: string;
    name: string;
    icon: string | null;
    description: string;
  };
  bot: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
  };
  expires: string;
  user: User;
  scopes: string[];
  access_token: string;
};
/**
 * OAuth2 Scopes
 */
declare enum Scope {
  Identify = "identify",
  Email = "email",
  Connections = "connections",
  Guilds = "guilds",
  GuildsJoin = "guilds.join",
  GuildsMembersRead = "guilds.members.read",
  GuildsChannelsRead = "guilds.channels.read",
  GroupDMJoin = "gdm.join",
  Bot = "bot",
  RPC = "rpc",
  RPCNotificationsRead = "rpc.notifications.read",
  RPCVoiceRead = "rpc.voice.read",
  RPCVoiceWrite = "rpc.voice.write",
  RPCVideoRead = "rpc.video.read",
  RPCVideoWrite = "rpc.video.write",
  RPCScreenshareRead = "rpc.screenshare.read",
  RPCScreenshareWrite = "rpc.screenshare.write",
  RPCActivitiesWrite = "rpc.activities.write",
  WebhookIncoming = "webhook.incoming",
  MessagesRead = "messages.read",
  ApplicationsBuildsUpload = "applications.builds.upload",
  ApplicationsBuildsRead = "applications.builds.read",
  ApplicationsCommands = "applications.commands",
  ApplicationsEntitlements = "applications.entitlements",
  ApplicationsStoreUpdate = "applications.store.update",
  ActivitiesRead = "activities.read",
  ActivitiesWrite = "activities.write",
  ActivitiesInvitesWrite = "activities.invites.write",
  RelationshipsRead = "relationships.read",
  RelationshipsWrite = "relationships.write",
  Voice = "voice",
  DMChannelsRead = "dm_channels.read",
  RoleConnectionsWrite = "role_connections.write",
  PresencesRead = "presences.read",
  PresencesWrite = "presences.write",
  Openid = "openid",
  DMChannelsMessagesRead = "dm_channels.messages.read",
  DMChannelsMessagesWrite = "dm_channels.messages.write",
  GatewayConnect = "gateway.connect",
  AccountGlobalNameUpdate = "account.global_name.update",
  PaymentSourcesCountryCode = "payment_sources.country_code",
  SDKSocialLayerPresence = "sdk.social_layer_presence",
  SDKSocialLayer = "sdk.social_layer",
  LobbiesWrite = "lobbies.write",
  ApplicationIdentitiesWrite = "application.identities.write",
  ApplicationCommandsPermissionsUpdate = "application.commands.permissions.update"
}
//#endregion
//#region src/types/commands.d.ts
/**
 * Commands sent to Discord IPC
 */
declare enum Command {
  ACCEPT_ACTIVITY_INVITE = "ACCEPT_ACTIVITY_INVITE",
  ACTIVITY_INVITE_USER = "ACTIVITY_INVITE_USER",
  AUTHENTICATE = "AUTHENTICATE",
  AUTHORIZE = "AUTHORIZE",
  BRAINTREE_POPUP_BRIDGE_CALLBACK = "BRAINTREE_POPUP_BRIDGE_CALLBACK",
  BROWSER_HANDOFF = "BROWSER_HANDOFF",
  CAPTURE_SHORTCUT = "CAPTURE_SHORTCUT",
  CLOSE_ACTIVITY_JOIN_REQUEST = "CLOSE_ACTIVITY_JOIN_REQUEST",
  CONNECTIONS_CALLBACK = "CONNECTIONS_CALLBACK",
  CONNECT_TO_LOBBY = "CONNECT_TO_LOBBY",
  CONNECT_TO_LOBBY_VOICE = "CONNECT_TO_LOBBY_VOICE",
  CREATE_CHANNEL_INVITE = "CREATE_CHANNEL_INVITE",
  CREATE_LOBBY = "CREATE_LOBBY",
  DEEP_LINK = "DEEP_LINK",
  DELETE_LOBBY = "DELETE_LOBBY",
  DISCONNECT_FROM_LOBBY = "DISCONNECT_FROM_LOBBY",
  DISCONNECT_FROM_LOBBY_VOICE = "DISCONNECT_FROM_LOBBY_VOICE",
  DISPATCH = "DISPATCH",
  GET_APPLICATION_TICKET = "GET_APPLICATION_TICKET",
  GET_CHANNEL = "GET_CHANNEL",
  GET_CHANNELS = "GET_CHANNELS",
  GET_ENTITLEMENTS = "GET_ENTITLEMENTS",
  GET_ENTITLEMENT_TICKET = "GET_ENTITLEMENT_TICKET",
  GET_GUILD = "GET_GUILD",
  GET_GUILDS = "GET_GUILDS",
  GET_IMAGE = "GET_IMAGE",
  GET_NETWORKING_CONFIG = "GET_NETWORKING_CONFIG",
  GET_RELATIONSHIPS = "GET_RELATIONSHIPS",
  GET_SELECTED_VOICE_CHANNEL = "GET_SELECTED_VOICE_CHANNEL",
  GET_SKUS = "GET_SKUS",
  GET_USER = "GET_USER",
  GET_USER_ACHIEVEMENTS = "GET_USER_ACHIEVEMENTS",
  GET_VOICE_SETTINGS = "GET_VOICE_SETTINGS",
  GIFT_CODE_BROWSER = "GIFT_CODE_BROWSER",
  GUILD_TEMPLATE_BROWSER = "GUILD_TEMPLATE_BROWSER",
  INVITE_BROWSER = "INVITE_BROWSER",
  NETWORKING_CREATE_TOKEN = "NETWORKING_CREATE_TOKEN",
  NETWORKING_PEER_METRICS = "NETWORKING_PEER_METRICS",
  NETWORKING_SYSTEM_METRICS = "NETWORKING_SYSTEM_METRICS",
  OPEN_OVERLAY_ACTIVITY_INVITE = "OPEN_OVERLAY_ACTIVITY_INVITE",
  OPEN_OVERLAY_GUILD_INVITE = "OPEN_OVERLAY_GUILD_INVITE",
  OPEN_OVERLAY_VOICE_SETTINGS = "OPEN_OVERLAY_VOICE_SETTINGS",
  OVERLAY = "OVERLAY",
  SEARCH_LOBBIES = "SEARCH_LOBBIES",
  SELECT_TEXT_CHANNEL = "SELECT_TEXT_CHANNEL",
  SELECT_VOICE_CHANNEL = "SELECT_VOICE_CHANNEL",
  SEND_ACTIVITY_JOIN_INVITE = "SEND_ACTIVITY_JOIN_INVITE",
  SEND_TO_LOBBY = "SEND_TO_LOBBY",
  SET_ACTIVITY = "SET_ACTIVITY",
  SET_CERTIFIED_DEVICES = "SET_CERTIFIED_DEVICES",
  SET_OVERLAY_LOCKED = "SET_OVERLAY_LOCKED",
  SET_USER_ACHIEVEMENT = "SET_USER_ACHIEVEMENT",
  SET_USER_VOICE_SETTINGS = "SET_USER_VOICE_SETTINGS",
  SET_USER_VOICE_SETTINGS_2 = "SET_USER_VOICE_SETTINGS_2",
  SET_VOICE_SETTINGS = "SET_VOICE_SETTINGS",
  SET_VOICE_SETTINGS_2 = "SET_VOICE_SETTINGS_2",
  START_PURCHASE = "START_PURCHASE",
  SUBSCRIBE = "SUBSCRIBE",
  UNSUBSCRIBE = "UNSUBSCRIBE",
  UPDATE_LOBBY = "UPDATE_LOBBY",
  UPDATE_LOBBY_MEMBER = "UPDATE_LOBBY_MEMBER",
  VALIDATE_APPLICATION = "VALIDATE_APPLICATION"
}
//#endregion
//#region src/types/errors.d.ts
/**
 * Enum for error codes.
 */
declare enum Error {
  CAPTURE_SHORTCUT_ALREADY_LISTENING = 5004,
  GET_GUILD_TIMED_OUT = 5002,
  INVALID_ACTIVITY_JOIN_REQUEST = 4012,
  INVALID_ACTIVITY_SECRET = 5005,
  INVALID_CHANNEL = 4005,
  INVALID_CLIENTID = 4007,
  INVALID_COMMAND = 4002,
  INVALID_ENTITLEMENT = 4015,
  INVALID_EVENT = 4004,
  INVALID_GIFT_CODE = 4016,
  INVALID_GUILD = 4003,
  INVALID_INVITE = 4011,
  INVALID_LOBBY = 4013,
  INVALID_LOBBY_SECRET = 4014,
  INVALID_ORIGIN = 4008,
  INVALID_PAYLOAD = 4000,
  INVALID_PERMISSIONS = 4006,
  INVALID_TOKEN = 4009,
  INVALID_USER = 4010,
  LOBBY_FULL = 5007,
  NO_ELIGIBLE_ACTIVITY = 5006,
  OAUTH2_ERROR = 5000,
  PURCHASE_CANCELED = 5008,
  PURCHASE_ERROR = 5009,
  RATE_LIMITED = 5011,
  SELECT_CHANNEL_TIMED_OUT = 5001,
  SELECT_VOICE_FORCE_REQUIRED = 5003,
  SERVICE_UNAVAILABLE = 1001,
  TRANSACTION_ABORTED = 1002,
  UNAUTHORIZED_FOR_ACHIEVEMENT = 5010,
  UNKNOWN_ERROR = 1000
}
/**
 * Enum for WebSocket close codes.
 */
declare enum CloseCodes {
  CLOSE_NORMAL = 1000,
  CLOSE_UNSUPPORTED = 1003,
  CLOSE_ABNORMAL = 1006,
  INVALID_CLIENTID = 4000,
  INVALID_ORIGIN = 4001,
  RATELIMITED = 4002,
  TOKEN_REVOKED = 4003,
  INVALID_VERSION = 4004,
  INVALID_ENCODING = 4005
}
//#endregion
//#region src/types/events.d.ts
/**
 * Enum for subscribable events.
 */
declare enum Event {
  CURRENT_USER_UPDATE = "CURRENT_USER_UPDATE",
  GUILD_STATUS = "GUILD_STATUS",
  GUILD_CREATE = "GUILD_CREATE",
  CHANNEL_CREATE = "CHANNEL_CREATE",
  RELATIONSHIP_UPDATE = "RELATIONSHIP_UPDATE",
  VOICE_CHANNEL_SELECT = "VOICE_CHANNEL_SELECT",
  VOICE_STATE_CREATE = "VOICE_STATE_CREATE",
  VOICE_STATE_DELETE = "VOICE_STATE_DELETE",
  VOICE_STATE_UPDATE = "VOICE_STATE_UPDATE",
  VOICE_SETTINGS_UPDATE = "VOICE_SETTINGS_UPDATE",
  VOICE_SETTINGS_UPDATE_2 = "VOICE_SETTINGS_UPDATE_2",
  VOICE_CONNECTION_STATUS = "VOICE_CONNECTION_STATUS",
  SPEAKING_START = "SPEAKING_START",
  SPEAKING_STOP = "SPEAKING_STOP",
  GAME_JOIN = "GAME_JOIN",
  GAME_SPECTATE = "GAME_SPECTATE",
  ACTIVITY_JOIN = "ACTIVITY_JOIN",
  ACTIVITY_JOIN_REQUEST = "ACTIVITY_JOIN_REQUEST",
  ACTIVITY_SPECTATE = "ACTIVITY_SPECTATE",
  ACTIVITY_INVITE = "ACTIVITY_INVITE",
  NOTIFICATION_CREATE = "NOTIFICATION_CREATE",
  MESSAGE_CREATE = "MESSAGE_CREATE",
  MESSAGE_UPDATE = "MESSAGE_UPDATE",
  MESSAGE_DELETE = "MESSAGE_DELETE",
  LOBBY_DELETE = "LOBBY_DELETE",
  LOBBY_UPDATE = "LOBBY_UPDATE",
  LOBBY_MEMBER_CONNECT = "LOBBY_MEMBER_CONNECT",
  LOBBY_MEMBER_DISCONNECT = "LOBBY_MEMBER_DISCONNECT",
  LOBBY_MEMBER_UPDATE = "LOBBY_MEMBER_UPDATE",
  LOBBY_MESSAGE = "LOBBY_MESSAGE",
  CAPTURE_SHORTCUT_CHANGE = "CAPTURE_SHORTCUT_CHANGE",
  OVERLAY = "OVERLAY",
  OVERLAY_UPDATE = "OVERLAY_UPDATE",
  ENTITLEMENT_CREATE = "ENTITLEMENT_CREATE",
  ENTITLEMENT_DELETE = "ENTITLEMENT_DELETE",
  USER_ACHIEVEMENT_UPDATE = "USER_ACHIEVEMENT_UPDATE",
  READY = "READY",
  ERROR = "ERROR"
}
//#endregion
//#region src/types/opcodes.d.ts
declare enum OpCode {
  HANDSHAKE = 0,
  FRAME = 1,
  CLOSE = 2,
  PING = 3,
  PONG = 4
}
//#endregion
//#region src/builder.d.ts
/**
 * Builder class for constructing Discord Rich Presence activity payloads.
 */
declare class PresenceBuilder {
  /**
   * Internal payload being constructed
   */
  private payload;
  /**
   * Sets the activity type (eg. Playing, Listening, Watching, Competing).
   * @param type Activity type as defined by Discord (0, 2, 3, 5)
   * @returns The PresenceBuilder instance for chaining
   */
  setType(type: ActivityType): this;
  /**
   * Sets the details of the activity.
   * @param details Details string (Max 128 chars)
   * @param url Optional URL when clicking the details text
   * @returns The PresenceBuilder instance for chaining
   * @throws Error if details exceed character limit
   */
  setDetails(details: string, url?: string): this;
  /**
   * Sets the state of the activity.
   * @param state State string (Max 128 chars)
   * @param url Optional URL when clicking the state text
   * @returns The PresenceBuilder instance for chaining
   * @throws Error if state exceeds character limit
   */
  setState(state: string, url?: string): this;
  /**
   * Sets the timestamps object directly.
   * @param timestamps Timestamps object with start and end times
   * @returns The PresenceBuilder instance for chaining
   */
  setTimestamps(timestamps: Timestamps): this;
  /**
   * Sets the start timestamp for the activity.
   * @param date Start time as a Date object or Unix timestamp
   * @returns The PresenceBuilder instance for chaining
   */
  setStartTimestamp(date: number | Date): this;
  /**
   * Sets the end timestamp for the activity.
   * @param date End time as a Date object or Unix timestamp
   * @returns The PresenceBuilder instance for chaining
   */
  setEndTimestamp(date: number | Date): this;
  /**
   * Sets the assets object directly.
   * @param assets Assets object with large_image, small_image, etc.
   * @returns The PresenceBuilder instance for chaining
   * @throws Error if any text fields exceed character limits
   */
  setAssets(assets: Assets): this;
  /**
   * Sets the large image for the activity.
   * @param key The key of the large image asset (defined in your Discord application)
   * @param text Optional tooltip text for the large image (Max 128 chars)
   * @param url Optional URL when the large image is clicked
   * @returns The PresenceBuilder instance for chaining
   * @throws Error if text exceeds character limit
   */
  setLargeImage(key: string, text?: string, url?: string): this;
  /**
   * Sets the small image for the activity.
   * @param key The key of the small image asset (defined in your Discord application)
   * @param text Optional tooltip text for the small image (Max 128 chars)
   * @param url Optional URL when the small image is clicked
   * @returns The PresenceBuilder instance for chaining
   * @throws Error if text exceeds character limit
   */
  setSmallImage(key: string, text?: string, url?: string): this;
  /**
   * Sets the party information for the activity.
   * @param id Unique ID for the party
   * @param current Current size of the party
   * @param max Maximum size of the party
   * @returns The PresenceBuilder instance for chaining
   */
  setParty(id: string, current: number, max: number): this;
  /**
   * Sets the secrets for the activity.
   * @param secrets Object containing join, spectate, and match secrets
   * @returns The PresenceBuilder instance for chaining
   */
  setSecrets(secrets: {
    join?: string;
    spectate?: string;
    match?: string;
  }): this;
  /**
   * Whether this activity is an instanced context, like a match.
   * @param instance Boolean indicating if this is an instanced activity
   * @returns The PresenceBuilder instance for chaining
   */
  setInstance(instance: boolean): this;
  /**
   * Sets buttons for the activity.
   * @param buttons Array of button objects with label and url
   * @returns The PresenceBuilder instance for chaining
   * @throws Error if more than 2 buttons are provided or character limits are exceeded
   */
  setButtons(buttons: {
    label: string;
    url: string;
  }[]): this;
  /**
   * Adds a single button to the activity.
   * @param label Button label (Max 32 chars)
   * @param url Button URL (Max 512 chars)
   * @returns The PresenceBuilder instance for chaining
   * @throws Error if button constraints are violated
   */
  addButton(label: string, url: string): this;
  /**
   * Builds and returns the final activity payload. Performs final conflict checks.
   * @returns The constructed ActivityPayload ready to be sent to Discord
   */
  build(): ActivityPayload;
  /**
   * Internal helper to validate button constraints.
   * @param label Button label (Max 32 chars)
   * @param url Button URL (Max 512 chars)
   * @throws Error if validation fails
   */
  private validateButton;
}
//#endregion
//#region src/client.d.ts
/**
 * Main RPC Client for managing Discord Rich Presence.
 */
declare class Client extends EventEmitter {
  /**
   * Underlying Discord IPC connection
   */
  private connection;
  /**
   * Indicates if the client is ready (handshake complete)
   */
  private isReady;
  /**
   * The client ID of the Discord application
   */
  private clientId?;
  /**
   * Timer for heartbeat pings to keep the connection alive
   */
  private heartbeatTimer?;
  /**
   * Timer for attempting reconnection if the connection is lost
   */
  private reconnectTimer?;
  /**
   * Stores the last activity payload for potential reconnection scenarios
   */
  private lastActivity?;
  /**
   * True once destroy() has been called. Guards every reconnect code path so
   * a connection attempt that was already in flight when destroy() ran can't
   * schedule another reconnect afterwards (see connectWithRetry/attemptReconnect).
   */
  private isDestroyed;
  /**
   * Number of consecutive failed reconnect attempts since the last successful READY.
   */
  private reconnectAttempts;
  /**
   * Maximum number of automatic reconnect attempts before giving up and
   * emitting 'reconnect_failed'. Defaults to Infinity to preserve the
   * previous unbounded-retry behavior for existing consumers.
   */
  private maxReconnectAttempts;
  /**
   * Initializes a new RPC Client instance.
   */
  constructor(options?: ClientOptions);
  /**
   * Indicates whether the client is currently connected and ready to send/receive commands.
   * @returns boolean indicating connection status
   */
  get isConnected(): boolean;
  /**
   * Handles incoming data from Discord.
   * @param op OpCode of the incoming message
   * @param data Payload data
   * @returns void
   */
  private handleIncoming;
  /**
   * Logs in to Discord and establishes the IPC connection.
   * @param timeout Optional milliseconds to wait for READY before rejecting.
   *   If omitted, login() only settles once READY fires or reconnect attempts
   *   are exhausted (see `maxReconnectAttempts` in ClientOptions).
   * @returns Promise that resolves when login is successful, rejects if the
   *   connection can't be established (timeout, or max reconnect attempts reached).
   */
  login({ clientId, clientSecret, scopes, accessToken, timeout }: {
    clientId: string;
    clientSecret?: string;
    scopes?: string[];
    accessToken?: string;
    timeout?: number;
  }): Promise<ReadyResponse>;
  /**
   * Attempts to reconnect to Discord with exponential backoff.
   */
  private connectWithRetry;
  /**
   * Sets a timer to attempt reconnection after a delay if the connection is lost,
   * unless the client has been destroyed or maxReconnectAttempts has been reached.
   */
  private attemptReconnect;
  /**
   * Destroys the RPC client and closes the IPC connection.
   * @returns Promise that resolves when the client is destroyed
   */
  destroy(): Promise<void>;
  /**
   * Sends a ping to Discord to keep the connection alive.
   */
  ping(): void;
  /**
   * Sends a command request to Discord and waits for the response.
   * @param cmd Command to send
   * @param args Arguments for the command
   * @param evt Optional event name to listen for
   * @returns Promise that resolves with the command response
   */
  request(cmd: Command, args?: object, evt?: Event): Promise<any>;
  /**
   * Authorizes the application and retrieves an authorization code.
   * @param param0 Object containing clientId and scopes
   * @returns Promise that resolves with the authorization code
   */
  authorize({ clientId, scopes, args }: {
    clientId: string;
    scopes: string[];
    args?: object;
  }): Promise<AuthorizeResponse>;
  /**
   * Authenticates the user with an access token.
   * @param accessToken Access token to authenticate with
   * @returns Promise that resolves with the authentication response
   */
  authenticate(accessToken: string): Promise<AuthenticateResponse>;
  /**
   * Exchanges an authorization code for an access token.
   * @param param0 Object containing clientId, clientSecret, code, and redirectUri
   * @returns Promise that resolves with the access token response
   */
  exchangeCode({ clientId, clientSecret, code, redirectUri }: {
    clientId: string;
    clientSecret: string;
    code: string;
    redirectUri: string;
  }): Promise<{
    access_token: string;
    scope: string;
    token_type: string;
  }>;
  /**
   * Subscribes to a specific event from Discord.
   * @param event Event name to subscribe to
   * @param args Optional arguments for the subscription
   * @returns Promise that resolves with an unsubscribe function
   */
  subscribe(event: Event, args?: object): Promise<{
    unsubscribe: () => Promise<void>;
  }>;
  /**
   * Sets the Rich Presence activity for the user.
   * @param activity Activity payload to set
   * @returns void
   */
  setActivity(activity: ActivityPayload): Promise<any> | undefined;
  /**
   * Clears the current Rich Presence activity.
   * @returns void
   */
  clearActivity(): Promise<any> | undefined;
  /**
   * Generates a URL for a user's avatar.
   * @param userId User's ID
   * @param avatarHash User's avatar hash
   * @param options Optional parameters for the avatar URL
   * @returns URL string for the user's avatar
   */
  getAvatarUrl(userId: string, avatarHash?: string | null, options?: {
    extension?: 'webp' | 'png' | 'gif' | 'jpeg';
    size?: number;
    forceStatic?: boolean;
  }): string;
  /**
   * Retrieves the user's relationships.
   * @returns Promise that resolves with the user's relationships
   */
  getRelationships(): Promise<any>;
  /**
   * Creates a new lobby.
   * @param type Lobby type (private or public)
   * @param capacity Maximum number of members in the lobby
   * @param metadata Additional metadata for the lobby
   * @returns Promise that resolves with the created lobby information
   */
  createLobby(type: LobbyType, capacity: number, metadata: object): Promise<any>;
  /**
   * Deletes a lobby by its ID.
   * @param lobbyId ID of the lobby to delete
   * @returns Promise that resolves when the lobby is deleted
   */
  deleteLobby(lobbyId: string): Promise<any>;
  /**
   * Updates a lobby's information.
   * @param lobbyId ID of the lobby to update
   * @param param1 Object containing optional update fields
   * @returns Promise that resolves with the updated lobby information
   */
  updateLobby(lobbyId: string, { type, ownerId, capacity, metadata }?: {
    type?: LobbyType;
    ownerId?: string;
    capacity?: number;
    metadata?: object;
  }): Promise<any>;
  /**
   * Connects to a lobby using its ID and secret.
   * @param lobbyId ID of the lobby to connect to
   * @param secret Secret key for the lobby
   * @returns Promise that resolves when connected to the lobby
   */
  connectToLobby(lobbyId: string, secret: string): Promise<any>;
  /**
   * Sends data to all members of a lobby.
   * @param lobbyId ID of the lobby
   * @param data Data to send to the lobby members
   * @returns Promise that resolves when the data is sent
   */
  sendToLobby(lobbyId: string, data: any): Promise<any>;
  /**
   * Disconnects from a lobby by its ID.
   * @param lobbyId ID of the lobby to disconnect from
   * @returns Promise that resolves when disconnected from the lobby
   */
  disconnectFromLobby(lobbyId: string): Promise<any>;
  /**
   * Updates a lobby member's information.
   * @param lobbyId ID of the lobby
   * @param userId ID of the user/member
   * @param param2 Object containing optional update fields
   * @returns
   */
  updateLobbyMember(lobbyId: string, userId: string, { metadata }?: {
    metadata?: object;
  }): Promise<any>;
}
//#endregion
export { ActivityPayload, ActivityType, Assets, AuthenticateResponse, AuthorizeResponse, Button, Client, ClientOptions, CloseCodes, Command, Error, Event, LobbyType, OpCode, Party, PathData, PresenceBuilder, ReadyResponse, RelationshipType, Scope, Secrets, Timestamps, User };