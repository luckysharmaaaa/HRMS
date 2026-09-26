// ==========================================================
// 1. combineDateTime()
// ==========================================================

// Is function ka kaam:
// Date aur Time ko combine karke ek proper JavaScript Date banana.

// Example:
// dateStr = "2026-08-13"
// timeStr = "09:00:00"
//
// Dono combine honge:
// "2026-08-13T09:00:00"
//
// Phir new Date() isko actual Date object bana dega.

export const combineDateTime = (
  dateStr: string,
  timeStr: string
): Date => {

  // Date + Time ko combine kar rahe hain
  // "T" date aur time ko separate karne ke liye use hota hai.
  //
  // Example:
  // "2026-08-13" + "T" + "09:00:00"
  // = "2026-08-13T09:00:00"

  return new Date(`${dateStr}T${timeStr}`);
};


// ==========================================================
// 2. getScheduledShiftWindow()
// ==========================================================

// Is function ka kaam:
// Employee ki shift ka exact START aur END time nikalna.
//
// Ye normal shift aur night shift dono handle karta hai.
//
// Normal shift:
// 09:00 -> 18:00
//
// Night shift:
// 22:00 -> 06:00
//
// Night shift mein 06:00 next day hota hai.
// Example:
// 13 Aug 22:00 -> 14 Aug 06:00

export const getScheduledShiftWindow = (
  attendanceDate: string,

  // Shift ke andar humein sirf startTime aur endTime chahiye.
  shift: {
    startTime: string;
    endTime: string;
  },
) => {

  // --------------------------------------------------------
  // Shift ka START time bana rahe hain
  // --------------------------------------------------------

  // Example:
  // attendanceDate = "2026-08-13"
  // shift.startTime = "09:00:00"
  //
  // Result:
  // 2026-08-13 09:00:00

  const start = combineDateTime(
    attendanceDate,
    shift.startTime
  );


  // --------------------------------------------------------
  // Shift ka END time bana rahe hain
  // --------------------------------------------------------

  // Initially hum same attendance date use karenge.
  //
  // Example:
  // attendanceDate = "2026-08-13"
  // shift.endTime = "18:00:00"
  //
  // Result:
  // 2026-08-13 18:00:00

  // "let" use kiya hai kyunki night shift hone par
  // end ki date ko next day change karna padega.

  let end = combineDateTime(
    attendanceDate,
    shift.endTime
  );


  // ========================================================
  // NIGHT SHIFT CHECK
  // ========================================================

  // Ab check kar rahe hain:
  //
  // Kya END time, START time se pehle ya equal hai?
  //
  // Agar YES hai, iska matlab shift midnight cross kar rahi hai.
  //
  // Example:
  //
  // Start = 22:00
  // End   = 06:00
  //
  // 06:00 <= 22:00
  // YES
  //
  // Iska matlab 06:00 same day nahi,
  // NEXT DAY ka 06:00 hai.

  if (end <= start) {

    // End date ko 1 day aage kar rahe hain.
    //
    // Example:
    //
    // Pehle:
    // 2026-08-13 06:00
    //
    // + 1 day
    //
    // Baad mein:
    // 2026-08-14 06:00
    //
    // Ab night shift correctly represent hogi:
    //
    // 13 Aug 22:00
    //       ↓
    // 14 Aug 06:00

    end.setDate(end.getDate() + 1);
  }


  // --------------------------------------------------------
  // Final result return kar rahe hain
  // --------------------------------------------------------

  // start = shift ka actual start Date
  // end   = shift ka actual end Date
  //
  // Example normal shift:
  //
  // {
  //   start: 13 Aug 09:00,
  //   end:   13 Aug 18:00
  // }
  //
  // Example night shift:
  //
  // {
  //   start: 13 Aug 22:00,
  //   end:   14 Aug 06:00
  // }

  return {
    start,
    end
  };
};


// ==========================================================
// 3. diffMinutes()
// ==========================================================

// Is function ka kaam:
// Do Date objects ke beech ka difference
// MINUTES mein calculate karna.
//
// Example:
//
// 09:15 - 09:00 = 15 minutes
//
// Iska use attendance mein ho sakta hai:
// - Late minutes
// - Early departure minutes
// - Overtime minutes

export const diffMinutes = (
  a: Date,
  b: Date
): number => {

  // getTime() Date ko milliseconds mein convert karta hai.
  //
  // Example:
  // a.getTime() = time in milliseconds
  // b.getTime() = time in milliseconds
  //
  // Dono ko subtract karne par
  // milliseconds ka difference milta hai.

  // 60000 use kiya hai kyunki:
  //
  // 1 minute = 60 seconds
  // 1 second = 1000 milliseconds
  //
  // 60 × 1000 = 60000 milliseconds
  //
  // Isliye milliseconds ko minutes mein convert karne ke liye
  // 60000 se divide kar rahe hain.

  return Math.round(
    (a.getTime() - b.getTime()) / 60000
  );
};