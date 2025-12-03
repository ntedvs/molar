"use strict";
// Shared types between main and renderer processes
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCChannel = void 0;
var IPCChannel;
(function (IPCChannel) {
    IPCChannel["ENGINE_SELECT"] = "engine:select";
    IPCChannel["ENGINE_SELECTED"] = "engine:selected";
    IPCChannel["ENGINE_MOVE"] = "engine:move";
    IPCChannel["ENGINE_BESTMOVE"] = "engine:bestmove";
    IPCChannel["ENGINE_ERROR"] = "engine:error";
    IPCChannel["GAME_NEW"] = "game:new";
})(IPCChannel || (exports.IPCChannel = IPCChannel = {}));
//# sourceMappingURL=types.js.map