# Gemini Reflection Journal

An authenticated, full-stack personal reflection and journaling application built with **React**, **Express**, **Firebase Authentication (Google Sign-In)**, **Cloud Firestore**, and **Gemini 3.6 Flash**.

All user interactions, journal drafts, reflections, and multi-turn dialogues are strictly isolated to each authenticated user's private path in Cloud Firestore (`/users/{userId}/interactions/{interactionId}`) with zero insecure default permissions.

---

## 🌟 Architecture & Highlights

- **User Identity**: Firebase Authentication with Google Sign-In (no direct password or email storage in custom code).
- **Backend Database**: Cloud Firestore using owner-bound document subcollections (`/users/{userId}/interactions/{interactionId}`).
- **AI Processing Engine**: Gemini 3.6 Flash via server-side `@google/genai` with an automated 4-tier model fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`).
- **Secret Management**: API keys are strictly server-side, retrieved via Google Cloud Secret Manager / Environment Variables (`GEMINI_API_KEY`), never exposed to the client browser.
- **Persistence Guarantee**: Zero-crash undefined stripping, robust transaction verification, and draft retention upon any network or database failure.

---

## 🚀 Cloud Run Deployment & Configuration Guide

### 1. Prerequisites & GCP API Activation

Ensure you have the Google Cloud SDK (`gcloud`) installed and authenticated:

```bash
# Set your Google Cloud project
gcloud config set project YOUR_PROJECT_ID

# Enable the required APIs for Cloud Run, Secret Manager, and Cloud Firestore
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com
```

---

### 2. Secret Management Setup (Google Cloud Secret Manager)

Store your Gemini API key in Secret Manager and grant the Cloud Run runtime service account permission to access it:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Identify your project number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')

# 3. Grant the default Compute Engine service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

### 3. Database Security Configuration (Cloud Firestore Rules)

Deploy the following owner-bound Firestore security rules to guarantee strict multi-tenant isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Global Safety Net: Default deny catch-all
    match /{document=**} {
      allow read, write: if false;
    }

    // Isolated user-specific interactions & reflections
    match /users/{userId}/interactions/{interactionId} {
      function isValidInteraction(data) {
        return data.userId is string &&
               data.userId == userId &&
               data.content is string &&
               data.content.size() <= 10000 &&
               data.aiResponse is string &&
               data.aiResponse.size() <= 25000 &&
               data.mode in ['reflection', 'brainstorm', 'summary', 'converse'] &&
               data.createdAt is string;
      }

      allow read: if request.auth != null && request.auth.uid == userId;

      allow create: if request.auth != null &&
                       request.auth.uid == userId &&
                       isValidInteraction(request.resource.data);

      allow update: if request.auth != null &&
                       request.auth.uid == userId &&
                       isValidInteraction(request.resource.data) &&
                       request.resource.data.userId == resource.data.userId &&
                       request.resource.data.createdAt == resource.data.createdAt;

      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    match /test/connection {
      allow read: if true;
    }
  }
}
```

Deploy rules using the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

---

### 4. Deploying to Google Cloud Run

Deploy the full-stack container directly using the Google Cloud SDK:

```bash
# Build and deploy service to Cloud Run
gcloud run deploy gemini-reflection-journal \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port 3000
```

---

### 5. Mandatory Campaign Labeling & Verification Binding

Apply the required challenge verification label to your deployed Cloud Run service:

```bash
gcloud run services update gemini-reflection-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 💻 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   NODE_ENV="development"
   ```

3. Start the unified development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.
