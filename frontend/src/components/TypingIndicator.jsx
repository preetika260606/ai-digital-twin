function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-6">

      {/* AI Avatar */}
      <div
        className="w-9 h-9 rounded-full bg-black text-white
                   flex items-center justify-center
                   text-sm shrink-0 shadow-sm"
      >
        🧠
      </div>

      {/* Typing Bubble */}
      <div
        className="bg-white border border-gray-200
                   px-5 py-3.5 rounded-2xl rounded-bl-md
                   shadow-sm"
      >
        <div className="flex items-center gap-1.5">

          {/* Dot 1 */}
          <span
            className="w-2 h-2 bg-gray-400 rounded-full
                       animate-bounce"
          ></span>

          {/* Dot 2 */}
          <span
            className="w-2 h-2 bg-gray-400 rounded-full
                       animate-bounce [animation-delay:150ms]"
          ></span>

          {/* Dot 3 */}
          <span
            className="w-2 h-2 bg-gray-400 rounded-full
                       animate-bounce [animation-delay:300ms]"
          ></span>

        </div>
      </div>

    </div>
  );
}

export default TypingIndicator;