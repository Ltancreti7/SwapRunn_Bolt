import SiteHeader from "@/components/SiteHeader";
import BackButton from "@/components/BackButton";
import mapBackgroundImage from "@/assets/map-background.jpg";

const Privacy = () => {
  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${mapBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* SEO Meta Tags */}
      <title>Privacy Policy - SwapRunn Auto Delivery & Swap Management</title>
      <meta
        name="description"
        content="SwapRunn's privacy policy - how we protect your personal and business data in our auto delivery platform."
      />
      <link rel="canonical" href="https://swaprunn.com/privacy" />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>

      <div className="relative z-10 px-4 pt-24 py-12">
        <div className="content-container max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

          <div className="prose prose-lg max-w-none text-white space-y-8">
            <p className="text-white/70 text-lg mb-8">
              Last updated: October 04, 2025
            </p>

            <section className="mb-8">
              <p className="text-white/90 mb-6">
                This Privacy Notice for SwapRunn LLC (doing business as
                SwapRunn) ("<strong>we</strong>," "<strong>us</strong>," or "
                <strong>our</strong>"), describes how and why we might access,
                collect, store, use, and/or share ("<strong>process</strong>")
                your personal information when you use our services ("
                <strong>Services</strong>"), including when you:
              </p>
              <ul className="list-disc pl-6 mb-6 text-white/90 space-y-2">
                <li>
                  Visit our website at{" "}
                  <a
                    href="https://swaprunn.com"
                    className="text-[#E11900] hover:underline"
                  >
                    https://swaprunn.com
                  </a>{" "}
                  or any website of ours that links to this Privacy Notice
                </li>
                <li>
                  Download and use our mobile application (SwapRunn), or any
                  other application of ours that links to this Privacy Notice
                </li>
                <li>
                  Use SwapRunn. SwapRunn is a delivery coordination platform
                  designed for dealerships to instantly dispatch drivers for
                  vehicle swaps, customer deliveries, and off-site logistics.
                </li>
                <li>
                  Engage with us in other related ways, including any sales,
                  marketing, or events
                </li>
              </ul>
              <p className="text-white/90">
                <strong>Questions or concerns?</strong> Reading this Privacy
                Notice will help you understand your privacy rights and choices.
                We are responsible for making decisions about how your personal
                information is processed. If you do not agree with our policies
                and practices, please do not use our Services. If you still have
                any questions or concerns, please contact us at{" "}
                <a
                  href="mailto:ltancreti7@gmail.com"
                  className="text-[#E11900] hover:underline"
                >
                  ltancreti7@gmail.com
                </a>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                Summary of Key Points
              </h2>
              <p className="text-white/90 mb-4">
                <strong>
                  <em>
                    This summary provides key points from our Privacy Notice,
                    but you can find out more details about any of these topics
                    by using our table of contents below to find the section you
                    are looking for.
                  </em>
                </strong>
              </p>

              <div className="space-y-4 text-white/90">
                <p>
                  <strong>What personal information do we process?</strong> When
                  you visit, use, or navigate our Services, we may process
                  personal information depending on how you interact with us and
                  the Services, the choices you make, and the products and
                  features you use.
                </p>

                <p>
                  <strong>
                    Do we process any sensitive personal information?
                  </strong>{" "}
                  We do not process sensitive personal information.
                </p>

                <p>
                  <strong>
                    Do we collect any information from third parties?
                  </strong>{" "}
                  We do not collect any information from third parties.
                </p>

                <p>
                  <strong>How do we process your information?</strong> We
                  process your information to provide, improve, and administer
                  our Services, communicate with you, for security and fraud
                  prevention, and to comply with law. We may also process your
                  information for other purposes with your consent.
                </p>

                <p>
                  <strong>
                    In what situations and with which parties do we share
                    personal information?
                  </strong>{" "}
                  We may share information in specific situations and with
                  specific third parties.
                </p>

                <p>
                  <strong>How do we keep your information safe?</strong> We have
                  adequate organizational and technical processes and procedures
                  in place to protect your personal information. However, no
                  electronic transmission over the internet or information
                  storage technology can be guaranteed to be 100% secure.
                </p>

                <p>
                  <strong>What are your rights?</strong> Depending on where you
                  are located geographically, the applicable privacy law may
                  mean you have certain rights regarding your personal
                  information.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                1. What Information Do We Collect?
              </h2>
              <h3 className="text-2xl font-semibold text-white mb-4">
                Personal Information You Disclose to Us
              </h3>
              <p className="text-white/90 mb-4">
                <strong>
                  <em>In Short:</em>
                </strong>{" "}
                <em>We collect personal information that you provide to us.</em>
              </p>

              <p className="text-white/90 mb-4">
                We collect personal information that you voluntarily provide to
                us when you register on the Services, express an interest in
                obtaining information about us or our products and Services,
                when you participate in activities on the Services, or otherwise
                when you contact us.
              </p>

              <p className="text-white/90 mb-4">
                <strong>Personal Information Provided by You.</strong> The
                personal information that we collect may include the following:
              </p>
              <ul className="list-disc pl-6 mb-6 text-white/90 space-y-1">
                <li>Names</li>
                <li>Phone numbers</li>
                <li>Usernames</li>
                <li>Passwords</li>
                <li>Email addresses</li>
                <li>Job titles</li>
                <li>Contact preferences</li>
              </ul>

              <p className="text-white/90 mb-4">
                <strong>Sensitive Information.</strong> We do not process
                sensitive information.
              </p>

              <p className="text-white/90 mb-4">
                <strong>Payment Data.</strong> We may collect data necessary to
                process your payment if you choose to make purchases, such as
                your payment instrument number, and the security code associated
                with your payment instrument. All payment data is handled and
                stored by Stripe. You may find their privacy notice at:{" "}
                <a
                  href="https://stripe.com/privacy"
                  className="text-[#E11900] hover:underline"
                >
                  https://stripe.com/privacy
                </a>
                .
              </p>

              <h3 className="text-2xl font-semibold text-white mb-4">
                Application Data
              </h3>
              <p className="text-white/90 mb-4">
                If you use our application(s), we also may collect the following
                information if you choose to provide us with access or
                permission:
              </p>
              <ul className="list-disc pl-6 mb-6 text-white/90 space-y-2">
                <li>
                  <em>Geolocation Information.</em> We may request access or
                  permission to track location-based information from your
                  mobile device, either continuously or while you are using our
                  mobile application(s), to provide certain location-based
                  services.
                </li>
                <li>
                  <em>Mobile Device Access.</em> We may request access or
                  permission to certain features from your mobile device,
                  including your mobile device&apos;s camera, contacts, and
                  other features.
                </li>
                <li>
                  <em>Mobile Device Data.</em> We automatically collect device
                  information (such as your mobile device ID, model, and
                  manufacturer), operating system, version information and
                  system configuration information, device and application
                  identification numbers, browser type and version, hardware
                  model Internet service provider and/or mobile carrier, and
                  Internet Protocol (IP) address.
                </li>
                <li>
                  <em>Push Notifications.</em> We may request to send you push
                  notifications regarding your account or certain features of
                  the application(s).
                </li>
              </ul>

              <h3 className="text-2xl font-semibold text-white mb-4">
                Google API
              </h3>
              <p className="text-white/90 mb-4">
                Our use of information received from Google APIs will adhere to{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  className="text-[#E11900] hover:underline"
                >
                  Google API Services User Data Policy
                </a>
                , including the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy#limited-use"
                  className="text-[#E11900] hover:underline"
                >
                  Limited Use requirements
                </a>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                2. How Do We Process Your Information?
              </h2>
              <p className="text-white/90 mb-4">
                <strong>
                  <em>In Short:</em>
                </strong>{" "}
                <em>
                  We process your information to provide, improve, and
                  administer our Services, communicate with you, for security
                  and fraud prevention, and to comply with law. We may also
                  process your information for other purposes with your consent.
                </em>
              </p>

              <p className="text-white/90 mb-4">
                <strong>
                  We process your personal information for a variety of reasons,
                  depending on how you interact with our Services, including:
                </strong>
              </p>
              <ul className="list-disc pl-6 mb-6 text-white/90 space-y-2">
                <li>
                  <strong>
                    To facilitate account creation and authentication and
                    otherwise manage user accounts.
                  </strong>{" "}
                  We may process your information so you can create and log in
                  to your account, as well as keep your account in working
                  order.
                </li>
                <li>
                  <strong>
                    To deliver and facilitate delivery of services to the user.
                  </strong>{" "}
                  We may process your information to provide you with the
                  requested service.
                </li>
                <li>
                  <strong>
                    To respond to user inquiries/offer support to users.
                  </strong>{" "}
                  We may process your information to respond to your inquiries
                  and solve any potential issues you might have with the
                  requested service.
                </li>
                <li>
                  <strong>To send administrative information to you.</strong> We
                  may process your information to send you details about our
                  products and services, changes to our terms and policies, and
                  other similar information.
                </li>
                <li>
                  <strong>To enable user-to-user communications.</strong> We may
                  process your information if you choose to use any of our
                  offerings that allow for communication with another user.
                </li>
                <li>
                  <strong>To protect our Services.</strong> We may process your
                  information as part of our efforts to keep our Services safe
                  and secure, including fraud monitoring and prevention.
                </li>
                <li>
                  <strong>
                    To evaluate and improve our Services, products, marketing,
                    and your experience.
                  </strong>{" "}
                  We may process your information when we believe it is
                  necessary to identify usage trends, determine the
                  effectiveness of our promotional campaigns, and to evaluate
                  and improve our Services, products, marketing, and your
                  experience.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                3. When and With Whom Do We Share Your Personal Information?
              </h2>
              <p className="text-white/90 mb-4">
                <strong>
                  <em>In Short:</em>
                </strong>{" "}
                <em>
                  We may share information in specific situations described in
                  this section and/or with the following third parties.
                </em>
              </p>

              <p className="text-white/90 mb-4">
                We may need to share your personal information in the following
                situations:
              </p>
              <ul className="list-disc pl-6 mb-6 text-white/90 space-y-2">
                <li>
                  <strong>Business Transfers.</strong> We may share or transfer
                  your information in connection with, or during negotiations
                  of, any merger, sale of company assets, financing, or
                  acquisition of all or a portion of our business to another
                  company.
                </li>
                <li>
                  <strong>When we use Google Maps Platform APIs.</strong> We may
                  share your information with certain Google Maps Platform APIs
                  (e.g., Google Maps API, Places API). We obtain and store on
                  your device ("cache") your location. You may revoke your
                  consent anytime by contacting us at the contact details
                  provided at the end of this document.
                </li>
                <li>
                  <strong>Other Users.</strong> When you share personal
                  information (for example, by posting comments, contributions,
                  or other content to the Services) or otherwise interact with
                  public areas of the Services, such personal information may be
                  viewed by all users and may be publicly made available outside
                  the Services in perpetuity.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                4. Do We Use Cookies and Other Tracking Technologies?
              </h2>
              <p className="text-white/90 mb-4">
                <strong>
                  <em>In Short:</em>
                </strong>{" "}
                <em>
                  We may use cookies and other tracking technologies to collect
                  and store your information.
                </em>
              </p>

              <p className="text-white/90 mb-4">
                We may use cookies and similar tracking technologies (like web
                beacons and pixels) to gather information when you interact with
                our Services. Some online tracking technologies help us maintain
                the security of our Services and your account, prevent crashes,
                fix bugs, save your preferences, and assist with basic site
                functions.
              </p>

              <p className="text-white/90 mb-4">
                We also permit third parties and service providers to use online
                tracking technologies on our Services for analytics and
                advertising, including to help manage and display
                advertisements, to tailor advertisements to your interests, or
                to send abandoned shopping cart reminders (depending on your
                communication preferences).
              </p>

              <h3 className="text-2xl font-semibold text-white mb-4">
                Google Analytics
              </h3>
              <p className="text-white/90 mb-4">
                We may share your information with Google Analytics to track and
                analyze the use of the Services. The Google Analytics
                Advertising Features that we may use include: Remarketing with
                Google Analytics. To opt out of being tracked by Google
                Analytics across the Services, visit{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  className="text-[#E11900] hover:underline"
                >
                  https://tools.google.com/dlpage/gaoptout
                </a>
                . For more information on the privacy practices of Google,
                please visit the{" "}
                <a
                  href="https://policies.google.com/privacy"
                  className="text-[#E11900] hover:underline"
                >
                  Google Privacy & Terms page
                </a>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                5. How Long Do We Keep Your Information?
              </h2>
              <p className="text-white/90 mb-4">
                <strong>
                  <em>In Short:</em>
                </strong>{" "}
                <em>
                  We keep your information for as long as necessary to fulfill
                  the purposes outlined in this Privacy Notice unless otherwise
                  required by law.
                </em>
              </p>

              <p className="text-white/90 mb-4">
                We will only keep your personal information for as long as it is
                necessary for the purposes set out in this Privacy Notice,
                unless a longer retention period is required or permitted by law
                (such as tax, accounting, or other legal requirements). No
                purpose in this notice will require us keeping your personal
                information for longer than the period of time in which users
                have an account with us.
              </p>

              <p className="text-white/90 mb-4">
                When we have no ongoing legitimate business need to process your
                personal information, we will either delete or anonymize such
                information, or, if this is not possible (for example, because
                your personal information has been stored in backup archives),
                then we will securely store your personal information and
                isolate it from any further processing until deletion is
                possible.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                6. How Do We Keep Your Information Safe?
              </h2>
              <p className="text-white/90 mb-4">
                <strong>
                  <em>In Short:</em>
                </strong>{" "}
                <em>
                  We aim to protect your personal information through a system
                  of organizational and technical security measures.
                </em>
              </p>

              <p className="text-white/90 mb-4">
                We have implemented appropriate and reasonable technical and
                organizational security measures designed to protect the
                security of any personal information we process. However,
                despite our safeguards and efforts to secure your information,
                no electronic transmission over the Internet or information
                storage technology can be guaranteed to be 100% secure, so we
                cannot promise or guarantee that hackers, cybercriminals, or
                other unauthorized third parties will not be able to defeat our
                security and improperly collect, access, steal, or modify your
                information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                7. Do We Collect Information from Minors?
              </h2>
              <p className="text-white/90 mb-4">
                <strong>
                  <em>In Short:</em>
                </strong>{" "}
                <em>
                  We do not knowingly collect data from or market to children
                  under 18 years of age.
                </em>
              </p>

              <p className="text-white/90 mb-4">
                We do not knowingly collect, solicit data from, or market to
                children under 18 years of age, nor do we knowingly sell such
                personal information. By using the Services, you represent that
                you are at least 18 or that you are the parent or guardian of
                such a minor and consent to such minor dependent&apos;s use of
                the Services. If we learn that personal information from users
                less than 18 years of age has been collected, we will deactivate
                the account and take reasonable measures to promptly delete such
                data from our records. If you become aware of any data we may
                have collected from children under age 18, please contact us at{" "}
                <a
                  href="mailto:ltancreti7@gmail.com"
                  className="text-[#E11900] hover:underline"
                >
                  ltancreti7@gmail.com
                </a>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                8. What Are Your Privacy Rights?
              </h2>
              <p className="text-white/90 mb-4">
                <strong>
                  <em>In Short:</em>
                </strong>{" "}
                <em>
                  You may review, change, or terminate your account at any time,
                  depending on your country, province, or state of residence.
                </em>
              </p>

              <h3 className="text-2xl font-semibold text-white mb-4">
                Withdrawing Your Consent
              </h3>
              <p className="text-white/90 mb-4">
                If we are relying on your consent to process your personal
                information, which may be express and/or implied consent
                depending on the applicable law, you have the right to withdraw
                your consent at any time. You can withdraw your consent at any
                time by contacting us using the contact details provided below.
              </p>

              <h3 className="text-2xl font-semibold text-white mb-4">
                Account Information
              </h3>
              <p className="text-white/90 mb-4">
                If you would at any time like to review or change the
                information in your account or terminate your account, you can:
              </p>
              <ul className="list-disc pl-6 mb-6 text-white/90 space-y-1">
                <li>
                  Log in to your account settings and update your user account
                </li>
                <li>Contact us using the contact information provided</li>
              </ul>

              <p className="text-white/90 mb-4">
                Upon your request to terminate your account, we will deactivate
                or delete your account and information from our active
                databases. However, we may retain some information in our files
                to prevent fraud, troubleshoot problems, assist with any
                investigations, enforce our legal terms and/or comply with
                applicable legal requirements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                9. Controls for Do-Not-Track Features
              </h2>
              <p className="text-white/90 mb-4">
                Most web browsers and some mobile operating systems and mobile
                applications include a Do-Not-Track ("DNT") feature or setting
                you can activate to signal your privacy preference not to have
                data about your online browsing activities monitored and
                collected. At this stage, no uniform technology standard for
                recognizing and implementing DNT signals has been finalized. As
                such, we do not currently respond to DNT browser signals or any
                other mechanism that automatically communicates your choice not
                to be tracked online.
              </p>

              <p className="text-white/90 mb-4">
                California law requires us to let you know how we respond to web
                browser DNT signals. Because there currently is not an industry
                or legal standard for recognizing or honoring DNT signals, we do
                not respond to them at this time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                10. Do United States Residents Have Specific Privacy Rights?
              </h2>
              <p className="text-white/90 mb-4">
                <strong>
                  <em>In Short:</em>
                </strong>{" "}
                <em>
                  If you are a resident of California, Colorado, Connecticut,
                  Delaware, Florida, Indiana, Iowa, Kentucky, Maryland,
                  Minnesota, Montana, Nebraska, New Hampshire, New Jersey,
                  Oregon, Rhode Island, Tennessee, Texas, Utah, or Virginia, you
                  may have the right to request access to and receive details
                  about the personal information we maintain about you and how
                  we have processed it, correct inaccuracies, get a copy of, or
                  delete your personal information.
                </em>
              </p>

              <p className="text-white/90 mb-4">
                These rights may be limited in some circumstances by applicable
                law. Under certain US state data protection laws, you can
                designate an authorized agent to make a request on your behalf.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                11. Do We Make Updates to This Notice?
              </h2>
              <p className="text-white/90 mb-4">
                <strong>
                  <em>In Short:</em>
                </strong>{" "}
                <em>
                  Yes, we will update this notice as necessary to stay compliant
                  with relevant laws.
                </em>
              </p>

              <p className="text-white/90 mb-4">
                We may update this Privacy Notice from time to time. The updated
                version will be indicated by an updated "Revised" date at the
                top of this Privacy Notice. If we make material changes to this
                Privacy Notice, we may notify you either by prominently posting
                a notice of such changes or by directly sending you a
                notification.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                12. How Can You Contact Us About This Notice?
              </h2>
              <p className="text-white/90 mb-4">
                If you have questions or comments about this notice, you may
                email us at{" "}
                <a
                  href="mailto:ltancreti7@gmail.com"
                  className="text-[#E11900] hover:underline"
                >
                  ltancreti7@gmail.com
                </a>{" "}
                or contact us by post at:
              </p>

              <div className="text-white/90 mb-4">
                <p>SwapRunn LLC</p>
                <p>105 Route 44</p>
                <p>West Windsor, VT 05037</p>
                <p>United States</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                13. How Can You Review, Update, or Delete the Data We Collect
                from You?
              </h2>
              <p className="text-white/90 mb-4">
                Based on the applicable laws of your country or state of
                residence in the US, you may have the right to request access to
                the personal information we collect from you, details about how
                we have processed it, correct inaccuracies, or delete your
                personal information. You may also have the right to withdraw
                your consent to our processing of your personal information.
              </p>

              <p className="text-white/90 mb-4">
                To request to review, update, or delete your personal
                information, please fill out and submit a{" "}
                <a
                  href="https://app.termly.io/dsar/bf4639c6-3733-40e7-94b3-f3b77e68f3da"
                  className="text-[#E11900] hover:underline"
                >
                  data subject access request
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
