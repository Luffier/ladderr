#!/usr/bin/env bash
# Ladderr Linux protocol handler.
#
# Invoked by the .desktop handler with the full URI as $1, e.g.
#   ladderr-open:<base64>    -> open the file/folder
#   ladderr-select:<base64>  -> open the containing folder with the item selected

# Print the action ("open"/"select") for a URI, or return 1 if unrecognized.
ladderr_parse_scheme() {
    case "$1" in
        ladderr-open:*)   printf 'open' ;;
        ladderr-select:*) printf 'select' ;;
        *) return 1 ;;
    esac
}

# Strip the "ladderr-*:" scheme prefix, leaving the (maybe %-encoded) payload.
ladderr_strip_scheme() {
    printf '%s' "${1#ladderr-*:}"
}

# Percent-decode a string
ladderr_percent_decode() {
    local data="$1"
    printf '%b' "${data//%/\\x}"
}

# Percent-decode then base64-decode a payload into the real filesystem path
ladderr_decode_payload() {
    ladderr_percent_decode "$1" | base64 -d
}

# Percent-encode a path for use in a file:// URI, byte-wise, preserving '/'
# and unreserved characters. LC_ALL=C makes indexing operate on bytes so
# multi-byte UTF-8 is encoded per-byte (correct for URIs).
ladderr_urlencode() {
    local LC_ALL=C string="$1" out='' i c byte
    for (( i=0; i<${#string}; i++ )); do
        c="${string:i:1}"
        case "$c" in
            [a-zA-Z0-9/._~-]) out+="$c" ;;
            *) printf -v byte '%d' "'$c"; printf -v c '%%%02X' "$(( byte & 0xFF ))"; out+="$c" ;;
        esac
    done
    printf '%s' "$out"
}

# Open the containing folder with the item preselected, via the freedesktop
# FileManager1 D-Bus interface. Falls back to opening the parent directory.
ladderr_show_item() {
    local path="$1"
    local uri="file://$(ladderr_urlencode "$path")"
    if command -v dbus-send >/dev/null 2>&1 && \
       dbus-send --session --print-reply \
         --dest=org.freedesktop.FileManager1 \
         /org/freedesktop/FileManager1 \
         org.freedesktop.FileManager1.ShowItems \
         "array:string:$uri" string: >/dev/null 2>&1; then
        return 0
    fi
    xdg-open "$(dirname "$path")"
}

# Parse a ladderr URI and perform the requested action.
ladderr_main() {
    local uri="${1:-}" action path
    if ! action="$(ladderr_parse_scheme "$uri")"; then
        printf 'ladderr: unrecognized URI: %s\n' "$uri" >&2
        return 1
    fi
    path="$(ladderr_decode_payload "$(ladderr_strip_scheme "$uri")")"
    if [ "$action" = open ]; then
        xdg-open "$path"
    else
        ladderr_show_item "$path"
    fi
}

# Only run main when executed directly (for testing)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    set -euo pipefail
    ladderr_main "$@"
fi
