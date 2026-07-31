// The seven sections of a standard political vetting scope, turned into
// prompts a person can answer about themselves.
//
// These are written to jog memory, not to interrogate. The failure mode of a
// self-vet is not lying, it is forgetting: the account you stopped using in
// 2014, the business that closed owing somebody money, the petition you signed
// at a farmers market. A blank box asking "what is in your past?" finds none of
// that. A specific prompt does.
//
// Two rules held throughout:
//   1. Neutral wording. Nothing here implies the answer is shameful. A tool
//      that flinches gets flinching answers, and a flinching answer is a
//      surprise later.
//   2. Nothing is asked that the tool does not use. Every flagged item ends up
//      in the register with an action attached.
(function () {

  var SECTIONS = [
    {
      id: 'finances',
      name: 'Money',
      full: 'Finances',
      lede: 'Financial records are public, cheap to pull, and the first place anyone looks. None of this ends a campaign on its own. Being caught not mentioning it can.',
      items: [
        ['bankruptcy', 'A bankruptcy, personal or business'],
        ['lien', 'A tax lien, unpaid taxes, or a payment plan with the IRS or the state'],
        ['judgment', 'A judgment, a collection, or a debt that ended up in court'],
        ['foreclosure', 'A foreclosure, repossession, or eviction'],
        ['support', 'Unpaid child support or alimony'],
        ['closed-owing', 'A business that closed owing money to anyone'],
        ['informal', 'Undocumented loans from family, a partner, or an employer'],
        ['gambling', 'Gambling, crypto, or investment losses that are on a public record somewhere']
      ]
    },
    {
      id: 'legal',
      name: 'Legal',
      full: 'Legal',
      lede: 'Age does not help as much as people assume. A twenty year old charge still surfaces; what changes is how much it matters, and that depends almost entirely on whether you said it first.',
      items: [
        ['arrest', 'An arrest, a charge, or a conviction, however old and however it resolved'],
        ['dui', 'A DUI, or any traffic matter beyond a routine ticket'],
        ['order', 'A restraining or protective order, in either direction'],
        ['lawsuit', 'A lawsuit you filed, or one filed against you'],
        ['license', 'A professional license disciplined, suspended, or allowed to lapse under scrutiny'],
        ['sealed', 'A record you believe is sealed or expunged'],
        ['family-legal', 'A legal matter involving a family member that would be reported next to your name'],
        ['investigation', 'An investigation, audit, or inquiry that named you, even if it cleared you']
      ]
    },
    {
      id: 'statements',
      name: 'What you said',
      full: 'Past statements',
      lede: 'This is the section that catches first-time candidates, because the material is theirs, it is already public, and they have forgotten most of it. Go and look. Do not answer from memory.',
      items: [
        ['old-accounts', 'Posts on an account you no longer use, or thought you deleted'],
        ['changed-views', 'Something you wrote before your views changed'],
        ['joke', 'A joke that does not survive being read back without the room'],
        ['comments', 'Comments on a local news site, a forum, or a group thread'],
        ['letter', 'A letter to the editor, or public comment at a meeting'],
        ['recorded', 'Recorded remarks: a podcast, radio, video, or a recorded public meeting'],
        ['amplified', 'A share, retweet, or like that reads as an endorsement'],
        ['angry', 'Anything you posted while angry, about anyone'],
        ['group-chat', 'A group chat or email list where you were more candid than you would be publicly']
      ]
    },
    {
      id: 'work',
      name: 'Work',
      full: 'Employment and business',
      lede: 'Your working life is the part of your record most likely to involve other people who remember it differently than you do.',
      items: [
        ['fired', 'Fired, asked to resign, or left under a cloud'],
        ['hr', 'A dispute, complaint, or HR matter at a job'],
        ['partner', 'A business partner or investor with their own public problems'],
        ['conflict', 'A client, contract, or employer that conflicts with the office you are seeking'],
        ['nda', 'A non-compete, NDA, or severance agreement that limits what you can say'],
        ['unpaid', 'Layoffs, a closure, or unpaid staff or vendors at a business you ran'],
        ['industry', 'Work in an industry that is unpopular in your district'],
        ['licence-work', 'Doing work that required a licence or permit you did not hold at the time']
      ]
    },
    {
      id: 'personal',
      name: 'Personal',
      full: 'Personal and family',
      lede: 'The test here is not whether something is private. It is whether it is discoverable and whether it contradicts something you have said publicly.',
      items: [
        ['divorce', 'A divorce or custody matter with a public court record'],
        ['relationship', 'A relationship that would be reported if it were known'],
        ['family-record', 'A family member with their own legal, financial, or public record'],
        ['residency', 'A gap between where you actually live and where you are registered'],
        ['tenure', 'Living in the district for less time than people assume'],
        ['property', 'Property you own outside the district'],
        ['schools', 'Where your children go to school, if that sits oddly next to the office you want'],
        ['health', 'A health matter that would affect whether people think you can do the job']
      ]
    },
    {
      id: 'affiliations',
      name: 'Affiliations',
      full: 'Affiliations',
      lede: 'Everything you joined, funded, or signed is a matter of record, and the organisation you joined may have said things since that you did not.',
      items: [
        ['org', 'Membership in an organisation that has taken controversial positions'],
        ['donations', 'Political donations, including to the other party or to somebody now unpopular'],
        ['endorsed', 'A candidate or cause you endorsed that has aged badly'],
        ['church-club', 'A church, club, or fraternal organisation with a public position on something'],
        ['party', 'A prior party registration, or a party switch'],
        ['campaign', 'Involvement in a campaign that ended badly'],
        ['petition', 'A petition you signed'],
        ['board', 'A board or committee you sat on when it did something contested']
      ]
    },
    {
      id: 'record',
      name: 'Your record',
      full: 'Credentials and record',
      lede: 'Nobody loses over a real credential. People lose over the gap between the credential and the way it is written on their own bio.',
      items: [
        ['degree', 'A degree in progress, unfinished, or from a school with a reputation problem'],
        ['title', 'A job title on your bio that is more generous than the role actually was'],
        ['military', 'Military service details that would not survive a records check'],
        ['lapsed', 'Professional credentials that have lapsed'],
        ['voting', 'Your own voting record: primaries missed, elections skipped, a late registration'],
        ['attendance', 'Attendance at a board or commission you already serve on'],
        ['contradiction', 'Prior public statements that conflict with the platform you are running on'],
        ['bio', 'Anything on your current bio you would not want a reporter to check line by line']
      ]
    }
  ];

  // Every section takes a free-text addition, because a list of fifty prompts
  // is a memory aid and never a complete inventory of a life.
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
        out.push({ id: s.id + '.' + i[0], section: s.id, sectionName: s.full, label: i[1] });
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
