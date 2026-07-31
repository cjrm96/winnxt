// The seven sections of a standard political vetting scope, turned into
// prompts a person can answer about themselves.
//
// These are written to jog memory, not to interrogate. The failure mode of a
// self-vet is not lying, it is forgetting: the account you stopped using in
// 2014, the business that closed owing somebody money, the petition you signed
// at a farmers market. A blank box asking "what is in your past?" finds none of
// that. A specific prompt does, and a longer list finds more than a short one,
// which is the reason there are twenty per section rather than eight.
//
// The list is not invented. It is the standard vetting scope, plus a pass over
// what has actually ended political careers in roughly the last decade:
// resume fabrication, intimate images and messages, old costume and party
// photographs, relationships with subordinates, harassment allegations and the
// settlements that quietly paid them off, campaign money spent personally,
// attendance at an event that was unremarkable on the day and notorious after,
// and pandemic-era positions that aged badly. Each of those is a category of
// prompt here, never a named person.
//
// Three rules held throughout:
//   1. Neutral wording. Nothing here implies the answer is shameful. A tool
//      that flinches gets flinching answers, and a flinching answer is a
//      surprise later.
//   2. Every prompt names something concrete enough to go and check. "Any
//      financial problems" is not a prompt, it is a shrug.
//   3. Nothing is asked that the tool does not use. Every flagged item ends up
//      in the register with an action attached.
//
// A third element on a prompt marks its kind. 'private' means the material is
// not a public record but a thing held by a specific person, which changes what
// you can usefully do about it. See the contain tier in logic.js: announcing a
// private item is publication, not pre-emption, and the other person still has
// it afterwards.
//
// Each section also carries an opener: one clipped line in the voice of
// somebody running the session, sitting above the explanatory lede rather than
// replacing it. The voice belongs to the room. It never costs the reader
// information, and it goes plainer in Personal, where being pleased with
// itself would be genuinely unpleasant.
(function () {

  var SECTIONS = [
    {
      id: 'finances',
      name: 'Money',
      full: 'Finances',
      opener: 'Start with money. It is the cheapest thing to check, so it is the first thing checked.',
      lede: 'Financial records are public, cheap to pull, and the first place anyone looks. None of this ends a campaign on its own. Being caught not mentioning it can.',
      items: [
        ['bankruptcy', 'A bankruptcy, personal or business'],
        ['lien', 'A tax lien, unpaid taxes, or a payment plan with the IRS or the state'],
        ['unfiled', 'A year you did not file a return at all'],
        ['judgment', 'A judgment, a collection, or a debt that ended up in court'],
        ['foreclosure', 'A foreclosure, repossession, or eviction against you'],
        ['landlord', 'An eviction you filed, as a landlord'],
        ['support', 'Unpaid child support or alimony'],
        ['closed-owing', 'A business that closed owing money to anyone'],
        ['payroll', 'Late or missed payroll at a business you ran'],
        ['guarantee', 'A loan you personally guaranteed for somebody else'],
        ['informal', 'Undocumented loans from family, a partner, or an employer'],
        ['student', 'Student loans in default, deferment, or forgiveness'],
        ['crowdfunding', 'A GoFundMe or crowdfunding campaign you ran or benefited from'],
        ['side-income', 'Income you were paid in cash, or that never appeared on a return'],
        ['gambling', 'Gambling, crypto, or investment losses that are on a public record somewhere'],
        ['books', 'A business partner or family member who handled your books for you'],
        ['campaign-spend', 'Personal spending from a campaign, nonprofit, or business account'],
        ['exemption', 'A homestead, veteran, or senior property tax exemption you may not qualify for'],
        ['inside', 'Stock, property, or a purchase made where you knew something others did not'],
        ['vendor', 'A campaign vendor, consultant, or staffer you never finished paying']
      ]
    },
    {
      id: 'legal',
      name: 'Legal',
      full: 'Legal',
      opener: 'Now the record. Every one of these is public somewhere, and age helps less than people think.',
      lede: 'Age does not help as much as people assume. A twenty year old charge still surfaces; what changes is how much it matters, and that depends almost entirely on whether you said it first.',
      items: [
        ['arrest', 'An arrest, a charge, or a conviction, however old and however it resolved'],
        ['dui', 'A DUI, or any traffic matter beyond a routine ticket'],
        ['driving', 'A suspended licence, unpaid tickets, or an accident with a report'],
        ['juvenile', 'A juvenile record'],
        ['order', 'A restraining or protective order, in either direction'],
        ['lawsuit', 'A lawsuit you filed, or one filed against you'],
        ['settlement', 'A settlement with a confidentiality clause'],
        ['witness', 'Being named in somebody else\'s case, as a witness or a third party'],
        ['license', 'A professional licence disciplined, suspended, or allowed to lapse under scrutiny'],
        ['code', 'A code, zoning, health, or safety citation at a property or business you own'],
        ['neighbour', 'A dispute with a neighbour, an HOA, a landlord, or a tenant that went to a hearing'],
        ['sealed', 'A record you believe is sealed or expunged'],
        ['immigration', 'An immigration matter, yours or a family member\'s'],
        ['family-legal', 'A legal matter involving a family member that would be reported next to your name'],
        ['investigation', 'An investigation, audit, or inquiry that named you, even if it cleared you'],
        ['bar', 'A complaint filed against you with a licensing board, ethics body, or ombudsman'],
        ['allegation', 'An allegation of harassment, discrimination, or misconduct, formal or informal'],
        ['paid-out', 'A settlement paid by an employer, insurer, or organisation on your behalf'],
        ['police-call', 'A police call to your home or business, whether or not anyone was charged'],
        ['alleged', "Anything alleged about you in somebody else's filing, including a divorce"],
        ['name-change', 'A legal name change, which is a court record in most states']
      ]
    },
    {
      id: 'statements',
      name: 'What you said',
      full: 'Past statements',
      opener: 'Everything you have ever typed. This is the section people get wrong, because they answer from memory.',
      lede: 'This is the section that catches first-time candidates, because the material is theirs, it is already public, and they have forgotten most of it. Go and look. Do not answer from memory.',
      items: [
        ['old-accounts', 'Posts on an account you no longer use, or thought you deleted'],
        ['changed-views', 'Something you wrote before your views changed'],
        ['joke', 'A joke that does not survive being read back without the room'],
        ['angry', 'Anything you posted while angry, about anyone'],
        ['comments', 'Comments on a local news site, a forum, or a group thread'],
        ['reviews', 'Reviews you left under your own name, on Yelp, Google, or Amazon'],
        ['handle', 'A username or handle that connects to something else you have done'],
        ['dating', 'A dating profile, current or abandoned'],
        ['blog', 'A blog, newsletter, or personal site you no longer maintain'],
        ['letter', 'A letter to the editor, or public comment at a meeting'],
        ['recorded', 'Recorded remarks: a podcast, radio call-in, video, or a recorded public meeting'],
        ['amplified', 'A share, retweet, or like that reads as an endorsement'],
        ['group-chat', 'A group chat or email list where you were more candid than you would be publicly'],
        ['tagged', 'Photos other people posted and tagged you in'],
        ['byline', 'Anything published under your name, including a piece somebody else drafted'],
        ['archive', 'A yearbook, alumni magazine, student newspaper, or old employer newsletter'],
        ['intimate', 'Intimate messages, photos, or video you sent to anyone', 'private'],
        ['burner', 'A pseudonymous account, alt, or burner you posted from'],
        ['hot-mic', 'Something you said on a call or a hot mic you did not know was live'],
        ['plagiarism', "A speech, post, or paper that borrowed somebody else's words without credit"]
      ]
    },
    {
      id: 'work',
      name: 'Work',
      full: 'Employment and business',
      opener: 'Your working life. This is the one with other people in it, and they remember it differently than you do.',
      lede: 'Your working life is the part of your record most likely to involve other people who remember it differently than you do.',
      items: [
        ['fired', 'Fired, asked to resign, or left under a cloud'],
        ['hr', 'A dispute, complaint, or HR matter at a job'],
        ['grievance', 'A union grievance, on either side of it'],
        ['gap', 'A gap in your employment history you have never had to explain'],
        ['dates', 'A resume or bio where the dates or titles do not quite line up'],
        ['partner', 'A business partner or investor with their own public problems'],
        ['conflict', 'A client, contract, or employer that conflicts with the office you are seeking'],
        ['clients', 'Clients whose names you would not want printed in a list'],
        ['nda', 'A non-compete, NDA, or severance agreement that limits what you can say'],
        ['unpaid', 'Layoffs, a closure, or unpaid staff or vendors at a business you ran'],
        ['safety', 'A safety incident, inspection, or citation at a workplace you ran'],
        ['claim', 'A workers compensation or disability claim'],
        ['moonlight', 'A side business or second job an employer did not know about'],
        ['govt', 'A government contract, grant, permit, or subsidy you held'],
        ['industry', 'Work in an industry that is unpopular in your district'],
        ['reference', 'A former boss or colleague who would not vouch for you today'],
        ['subordinate', 'A relationship with somebody you supervised, taught, or had authority over'],
        ['accused', 'An allegation made against you by a colleague, student, client, or patient'],
        ['nonprofit', 'A nonprofit or charity you ran, its filings, and how it spent money'],
        ['failed-check', 'A professional exam, licence, or background check you did not pass']
      ]
    },
    {
      id: 'personal',
      name: 'Personal',
      full: 'Personal and family',
      opener: 'Family and private life. None of this is asked to be intrusive. It is asked because it is discoverable.',
      lede: 'The test here is not whether something is private. It is whether it is discoverable, and whether it contradicts something you have said publicly.',
      items: [
        ['divorce', 'A divorce or custody matter with a public court record'],
        ['relationship', 'A relationship that would be reported if it were known'],
        ['name', 'A previous name, a name change, or a name you have gone by'],
        ['family-record', 'A family member with their own legal, financial, or public record'],
        ['household', 'Somebody in your household with a public-facing job or record'],
        ['relative-govt', 'A relative who works for the government or district you would be joining'],
        ['family-business', 'A family business that does work with the jurisdiction'],
        ['residency', 'A gap between where you actually live and where you are registered'],
        ['prior-reg', 'Where you were registered to vote before, and when you changed it'],
        ['tenure', 'Living in the district for less time than people assume'],
        ['property', 'Property you own outside the district'],
        ['schools', 'Where your children go to school, if that sits oddly next to the office you want'],
        ['substance', 'Substance use, treatment, or recovery'],
        ['health', 'A health matter that would affect whether people think you can do the job'],
        ['mental', 'Treatment or a diagnosis that appears on a record somewhere'],
        ['complaint', 'A complaint from a neighbour: property, noise, animals, parking'],
        ['affair', 'An affair, or a relationship that overlapped with a marriage'],
        ['photos', 'Photographs of you that you would not want published', 'private'],
        ['costume', 'A costume, a party, or a night out that would not read now the way it did then'],
        ['rally', 'A rally, protest, or gathering you attended that later became notorious']
      ]
    },
    {
      id: 'affiliations',
      name: 'Affiliations',
      full: 'Affiliations',
      opener: 'Everything you joined, funded, or signed. All of it is filed somewhere.',
      lede: 'Everything you joined, funded, or signed is a matter of record, and the organisation you joined may have said things since that you did not.',
      items: [
        ['org', 'Membership in an organisation that has taken controversial positions'],
        ['later-scandal', 'Volunteering for a group that had a scandal after you left'],
        ['donations', 'Political donations, including to the other party or to somebody now unpopular'],
        ['pac', 'A political action committee you gave to, served on, or raised for'],
        ['endorsed', 'A candidate or cause you endorsed that has aged badly'],
        ['claimed', 'An endorsement you have claimed that was not quite given'],
        ['church-club', 'A church, club, or fraternal organisation with a public position on something'],
        ['restrictive', 'A social or country club with a restrictive membership history'],
        ['party', 'A prior party registration, or a party switch'],
        ['campaign', 'Involvement in a campaign that ended badly'],
        ['petition', 'A petition, recall, or ballot initiative you signed'],
        ['board', 'A board or committee you sat on when it did something contested'],
        ['union', 'A union membership, an office you held in one, or a picket line you crossed'],
        ['association', 'A professional association that lobbies on your behalf'],
        ['foreign', 'Foreign travel, foreign contacts, business abroad, or dual citizenship'],
        ['moderator', 'An online group or forum you ran or moderated'],
        ['photo-with', 'A photograph of you with somebody who later became notorious'],
        ['extremist', 'A group you joined, followed, or attended with that was later called extremist'],
        ['gift', 'A speaking fee, gift, or trip paid for by somebody with business before you'],
        ['pandemic', 'Positions you took publicly during the pandemic that have aged badly']
      ]
    },
    {
      id: 'record',
      name: 'Your record',
      full: 'Credentials and record',
      opener: 'Last, the bio. Every line on it is a claim, and a claim is something somebody can check.',
      lede: 'Nobody loses over a real credential. People lose over the gap between the credential and the way it is written on their own bio.',
      items: [
        ['degree', 'A degree in progress, unfinished, or from a school with a reputation problem'],
        ['title', 'A job title on your bio that is more generous than the role actually was'],
        ['awards', 'Awards or honours on your bio that would be hard to verify'],
        ['membership', 'Membership you still claim in something you have lapsed from'],
        ['military', 'Military service details that would not survive a records check'],
        ['lapsed', 'Professional credentials that have lapsed'],
        ['defunct', 'A certification from a body that no longer exists'],
        ['published', 'A paper, thesis, or article you would not stand behind today'],
        ['voting', 'Your own voting record: primaries missed, elections skipped, a late registration'],
        ['prior-run', 'A previous run for office, and everything you said during it'],
        ['attendance', 'Attendance at a board or commission you already serve on'],
        ['abstain', 'Votes you missed or abstained on that would be hard to explain'],
        ['finance-report', 'A campaign finance report filed late, amended, or flagged'],
        ['contradiction', 'Prior public statements that conflict with the platform you are running on'],
        ['following', 'Your own follower list, if it contains accounts you would not want screenshotted'],
        ['bio', 'Anything on your current bio you would not want a reporter to check line by line'],
        ['heritage', 'Claims about your family history, heritage, or where you are from'],
        ['charity', 'A charity or nonprofit you claim to have founded, run, or raised money for'],
        ['was-there', 'An event or moment you have described being at'],
        ['implied', 'Military, first responder, or frontline service you have implied rather than stated']
      ]
    }
  ];

  // Every section takes a free-text addition, because a list of a hundred
  // prompts is a memory aid and never a complete inventory of a life.
  var OTHER_LABEL = 'Something else in this category';

  var LIKELIHOOD = [
    ['high', 'Likely', 'It is already public, or somebody with a reason to look would find it in an afternoon.'],
    ['medium', 'Possible', 'It would take real effort, or it depends on somebody choosing to talk.'],
    ['low', 'Unlikely', 'Very few people know, and none of them have a reason to say so.']
  ];

  var SEVERITY = [
    ['severe', 'Severe', 'It goes to honesty, the law, or whether you are fit for the job. It could end this.'],
    ['serious', 'Serious', 'A bad few days. It costs you undecided voters and gives your opponent a line.'],
    ['survivable', 'Survivable', 'Awkward to explain, then over. Most things live here.']
  ];

  function allItems() {
    var out = [];
    SECTIONS.forEach(function (s) {
      s.items.forEach(function (i) {
        out.push({
          id: s.id + '.' + i[0], section: s.id, sectionName: s.full,
          label: i[1], kind: i[2] || null
        });
      });
    });
    return out;
  }

  function sectionById(id) {
    return SECTIONS.filter(function (s) { return s.id === id; })[0];
  }

  window.SelfVetItems = {
    SECTIONS: SECTIONS,
    LIKELIHOOD: LIKELIHOOD,
    SEVERITY: SEVERITY,
    OTHER_LABEL: OTHER_LABEL,
    allItems: allItems,
    sectionById: sectionById
  };
})();
