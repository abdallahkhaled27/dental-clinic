// The clinic's knowledge base — FAQ answers and policies too long or too
// numerous to reasonably hardcode into a chat system prompt (see
// clinic-data.ts for the small set of structured facts that ARE small
// enough to always include). Each entry becomes one row in the
// KnowledgeChunk table, embedded once by prisma/seed.ts, then retrieved
// per-question at chat time by src/lib/rag.ts.

export type KnowledgeEntry = {
  topic: string;
  content: string;
};

export const knowledgeBase: KnowledgeEntry[] = [
  {
    topic: "Insurance",
    content:
      "We accept most major PPO dental insurance plans, including Delta Dental, Cigna, MetLife, and Aetna. We do not currently accept HMO or DMO plans. We recommend calling our office with your insurance details before your visit so we can verify your specific coverage and estimate any out-of-pocket cost.",
  },
  {
    topic: "Cancellation policy",
    content:
      "We ask that you give at least 24 hours' notice if you need to cancel or reschedule an appointment. Cancellations made with less than 24 hours' notice, or missed appointments, may incur a $50 cancellation fee. Call us at (555) 123-4567 as soon as you know you need to reschedule.",
  },
  {
    topic: "First visit",
    content:
      "For your first visit, please arrive 15 minutes early to complete new patient paperwork, or fill it out online ahead of time if you'd like to save time. Bring a photo ID and your insurance card if you have one. Your first visit typically includes a full exam, X-rays if needed, and a cleaning, and usually takes about 60-90 minutes.",
  },
  {
    topic: "Payment and financing",
    content:
      "We accept cash, all major credit cards, and offer a monthly payment plan through CareCredit for treatments over $500, with 0% interest options for 6 or 12 months on approved credit. Payment is due at the time of service unless other arrangements have been made in advance with our front desk.",
  },
  {
    topic: "Dental emergencies",
    content:
      "We reserve same-day slots for dental emergencies such as severe tooth pain, a knocked-out tooth, a broken tooth, or significant swelling. Call our office as early as possible and describe your symptoms so we can prioritize your visit. Outside of business hours, our voicemail includes instructions for reaching the on-call dentist for true emergencies.",
  },
  {
    topic: "Teeth whitening details",
    content:
      "Our in-office teeth whitening treatment takes about 60-90 minutes and can lighten teeth several shades in a single visit. We also offer take-home whitening kits with custom-fitted trays for gradual whitening over 1-2 weeks. Results vary by patient and can last from several months to a couple of years depending on diet and oral hygiene habits.",
  },
  {
    topic: "Orthodontics and Invisalign",
    content:
      "We offer both traditional metal braces and Invisalign clear aligners for teens and adults. Treatment time typically ranges from 6 to 18 months depending on the complexity of the case. We offer a free orthodontic consultation to evaluate which option is the best fit before starting treatment.",
  },
  {
    topic: "Pediatric dentistry",
    content:
      "We welcome patients starting from age 1, following the American Academy of Pediatric Dentistry's recommendation for a first visit by a child's first birthday or within 6 months of their first tooth erupting. Our pediatric appointments are designed to be gentle and low-stress, with a focus on building comfort with dental visits early on.",
  },
  {
    topic: "Post-treatment care",
    content:
      "After most routine procedures like cleanings or fillings, you can eat and drink normally once any numbness wears off, usually within 2-4 hours. For more involved procedures like extractions or root canals, we provide written aftercare instructions specific to your treatment before you leave, and you're welcome to call the office with any questions during recovery.",
  },
  {
    topic: "Parking and accessibility",
    content:
      "Free parking is available directly in front of our building on Main Street, with additional spaces in the lot behind the building. Our office is fully wheelchair accessible, with a ramp at the main entrance and an accessible restroom on the ground floor.",
  },
];
