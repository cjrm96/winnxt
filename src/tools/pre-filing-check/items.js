// The nine-things-to-go-find bank. Process only — this file states no
// jurisdiction's rules, thresholds, or dollar figures, and never should.
//
// blocker: true  = do not spend money until this is confirmed in writing.
// ask:            = the literal question to put to the filing authority.
// why:            = what goes wrong when a candidate skips it.
var PREFILING_SECTIONS = [
  {
    id: 'office',
    title: 'The office you are actually running for',
    intro: 'Sounds obvious. It is the single most common thing first-timers get wrong on a form.',
    items: [
      {
        id: 'office-title',
        label: 'Exact office title as it appears on the ballot',
        blocker: true,
        ask: 'What is the exact title of this office as it will be printed on the ballot?',
        why: 'Not "school board" — the ballot may say "Member, Board of Education, District 3." Your filing form, your yard signs, and your disclaimer should all match it.'
      },
      {
        id: 'seat',
        label: 'Seat, district, ward, or position number',
        blocker: true,
        ask: 'Is this seat numbered, and if so, which number am I filing for?',
        why: 'Some bodies elect by numbered seat or position. File for the wrong one and you are running against a different person than you planned.'
      },
      {
        id: 'at-large',
        label: 'At-large or district-based, and how many seats are open',
        blocker: false,
        ask: 'Is this seat at-large or district-based, and how many seats on this body are up this cycle?',
        why: 'Three seats open with six candidates is a completely different race than one seat with two. It changes your vote target and your entire strategy.'
      },
      {
        id: 'term',
        label: 'Term length and whether this is a full or partial term',
        blocker: false,
        ask: 'What is the term length, and is this a full term or an unexpired partial term?',
        why: 'Partial terms come up when someone resigns. Voters will ask. So will the newspaper.'
      }
    ]
  },
  {
    id: 'eligibility',
    title: 'Whether you are eligible',
    intro: 'Confirm before you announce, not after.',
    items: [
      {
        id: 'residency',
        label: 'Residency requirement — where, and for how long before which date',
        blocker: true,
        ask: 'What is the residency requirement for this office, and what date is it measured from?',
        why: 'Residency is measured from a specific date, and it is the most common eligibility challenge filed against local candidates. If you moved recently, get this in writing.'
      },
      {
        id: 'registration',
        label: 'Voter registration status required',
        blocker: true,
        ask: 'Must I be a registered voter in this jurisdiction, and by what date?',
        why: 'Usually yes, sometimes with a duration attached. Check your own registration record rather than assuming it is current.'
      },
      {
        id: 'other-eligibility',
        label: 'Any other eligibility rules for this office',
        blocker: true,
        ask: 'Are there any other eligibility requirements — age, employment conflicts, holding other office, prior convictions?',
        why: 'Some seats bar current employees of the body, or people holding another elected office. Ask plainly and get the answer in writing.'
      }
    ]
  },
  {
    id: 'filing',
    title: 'How you get on the ballot',
    intro: 'This is the part with a hard, unmovable deadline.',
    items: [
      {
        id: 'authority',
        label: 'Which office you actually file with — name, address, hours',
        blocker: true,
        ask: 'Is this office the correct filing authority for this seat? If not, who is?',
        why: 'It may be the county clerk, the city secretary, the school district secretary, or a state agency. Filing with the wrong one is not a mistake you can fix on deadline day.'
      },
      {
        id: 'window',
        label: 'Filing window — the date and time it opens, and closes',
        blocker: true,
        ask: 'What date and time does filing open, and what date and time does it close?',
        why: 'The close is a time, not just a date, and it is enforced to the minute. Write down the time.'
      },
      {
        id: 'forms',
        label: 'The complete list of forms required to file',
        blocker: true,
        ask: 'What is the complete list of forms I must submit to appear on the ballot?',
        why: 'There is usually more than one, and a missing form on deadline day means you are not on the ballot. Ask for the list in writing and read it twice.'
      },
      {
        id: 'notarize',
        label: 'Anything requiring notarization or an original signature',
        blocker: false,
        ask: 'Does any form require notarization or an original wet signature, and can any of this be filed electronically?',
        why: 'Finding out you need a notary on the afternoon of the deadline is a preventable disaster.'
      },
      {
        id: 'fee-petition',
        label: 'Filing fee, petition signatures, or a choice between them',
        blocker: true,
        ask: 'Is there a filing fee, a signature petition, or a choice? What is the fee and how must it be paid?',
        why: 'Some jurisdictions let you pay a fee or gather signatures. Payment method can be restrictive — some will not take a personal check or a card.'
      },
      {
        id: 'signatures',
        label: 'Signature requirement — how many, who may sign, when they are valid from',
        blocker: true,
        ask: 'How many valid signatures do I need, who is eligible to sign, and is there a date before which signatures cannot be collected?',
        why: 'Signatures get thrown out. Plan to collect well more than the minimum. Signatures gathered before the legal start date are worthless.'
      }
    ]
  },
  {
    id: 'money',
    title: 'Before you touch a dollar',
    intro: 'These have to be true before your first expense, not before your first report.',
    items: [
      {
        id: 'treasurer',
        label: 'Whether a treasurer must be appointed before any money moves',
        blocker: true,
        ask: 'Must I appoint a treasurer and register a committee before raising or spending any money?',
        why: 'In many places, yes — and spending first is a violation on day one. Appointing a treasurer costs nothing. Do it early.'
      },
      {
        id: 'committee',
        label: 'Committee registration form and when it is due',
        blocker: true,
        ask: 'Which form registers my committee, and when is it due relative to my first contribution or expenditure?',
        why: 'The trigger is usually your first dollar in or out, not a calendar date.'
      },
      {
        id: 'bank',
        label: 'Whether a separate campaign bank account is required',
        blocker: false,
        ask: 'Am I required to keep campaign funds in a separate account?',
        why: 'Do this even where it is optional. Mixing campaign and personal money is how ordinary people end up in a news story about their finances.'
      },
      {
        id: 'reporting',
        label: 'Reporting schedule — which reports, due when',
        blocker: false,
        ask: 'What is the full schedule of campaign finance reports for this cycle, including any pre-election and post-election reports?',
        why: 'Ask for the whole calendar at once and put every date in your phone. Late reports carry penalties that accrue daily.'
      }
    ]
  },
  {
    id: 'disclaimer',
    title: 'The disclaimer',
    intro: 'This one has its own section because it is the mistake that costs real money.',
    items: [
      {
        id: 'disclaimer-text',
        label: 'The exact required disclaimer wording',
        blocker: true,
        ask: 'What is the exact disclaimer text required on campaign materials, word for word?',
        why: 'Consultants report candidates paying to print signs, cards, and door hangers before confirming this — then reprinting all of it. Get the exact wording in writing before a single print order.'
      },
      {
        id: 'disclaimer-where',
        label: 'Which materials need it, and any size or placement rules',
        blocker: true,
        ask: 'Which materials require the disclaimer, and are there size, contrast, or placement requirements?',
        why: 'Rules often specify minimum size or a percentage of the piece. A disclaimer too small to satisfy the rule is the same as no disclaimer.'
      },
      {
        id: 'disclaimer-digital',
        label: 'Whether it applies to digital ads, social posts, and your website',
        blocker: false,
        ask: 'Does the disclaimer requirement apply to online ads, social media posts, text messages, and my website?',
        why: 'Increasingly yes, and the rules for small digital formats are often different from print.'
      }
    ]
  },
  {
    id: 'contact',
    title: 'Your person at the filing office',
    intro: 'Run for Something asked candidates what helped most. The winning answer was not training — it was having a human who knew their deadlines.',
    items: [
      {
        id: 'clerk',
        label: 'Name, direct phone, and email of the person who answers these questions',
        blocker: false,
        ask: 'Who should I contact directly with filing questions, and what is the best number and email?',
        why: 'Get a name. Be polite, be brief, and thank them. You will call this person again, probably on a deadline day.'
      },
      {
        id: 'written',
        label: 'A written copy of the candidate guide or filing packet',
        blocker: true,
        ask: 'Is there a candidate guide or filing packet for this office, and can you email me a copy?',
        why: 'The written packet is what protects you. Verbal answers are helpful, but they are not evidence and people misremember.'
      }
    ]
  }
];
