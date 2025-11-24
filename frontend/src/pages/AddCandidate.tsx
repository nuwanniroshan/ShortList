import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from "@mui/material";
import {
  CameraAlt,
  Add,
  Close,
  DragIndicator,
  ExpandMore,
  UploadFile,
} from "@mui/icons-material";
import { API_URL } from "../api";
import { useSnackbar } from "../context/SnackbarContext";

interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  location: string;
  startDate: string;
  endDate: string;
}

interface ExperienceEntry {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
}

export function AddCandidate() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [submitting, setSubmitting] = useState(false);

  // Personal Information
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");

  // Education
  const [education, setEducation] = useState<EducationEntry[]>([
    { id: "1", institution: "", degree: "", location: "", startDate: "", endDate: "" },
  ]);

  // Experience
  const [experience, setExperience] = useState<ExperienceEntry[]>([
    { id: "1", company: "", position: "", location: "", startDate: "", endDate: "" },
  ]);

  // Additional Information
  const [desiredSalary, setDesiredSalary] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [website, setWebsite] = useState("");

  // Documents
  const [cv, setCv] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState<File | null>(null);

  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const coverLetterInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar("File size must not exceed 5MB", "error");
        return;
      }
      // Validate file type
      const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!validTypes.includes(file.type)) {
        showSnackbar("Only PDF, DOC, and DOCX files are allowed", "error");
        return;
      }
      setCv(file);
    }
  };

  const handleCoverLetterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar("File size must not exceed 5MB", "error");
        return;
      }
      // Validate file type
      const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!validTypes.includes(file.type)) {
        showSnackbar("Only PDF, DOC, and DOCX files are allowed", "error");
        return;
      }
      setCoverLetter(file);
    }
  };

  const addEducation = () => {
    setEducation([...education, { id: Date.now().toString(), institution: "", degree: "", location: "", startDate: "", endDate: "" }]);
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter((e) => e.id !== id));
  };

  const updateEducation = (id: string, field: keyof EducationEntry, value: string) => {
    setEducation(education.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const addExperience = () => {
    setExperience([...experience, { id: Date.now().toString(), company: "", position: "", location: "", startDate: "", endDate: "" }]);
  };

  const removeExperience = (id: string) => {
    setExperience(experience.filter((e) => e.id !== id));
  };

  const updateExperience = (id: string, field: keyof ExperienceEntry, value: string) => {
    setExperience(experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const handleSubmit = async (isDraft = false) => {
    // Validate required fields
    const name = `${firstName} ${lastName}`.trim();
    if (!name || !cv) {
      showSnackbar("Please fill in name and upload CV", "error");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("current_address", currentAddress);
    formData.append("permanent_address", permanentAddress);
    formData.append("jobId", jobId || "");
    formData.append("cv", cv);
    
    if (coverLetter) formData.append("cover_letter", coverLetter);
    if (profilePicture) formData.append("profile_picture", profilePicture);
    if (education.length > 0) formData.append("education", JSON.stringify(education));
    if (experience.length > 0) formData.append("experience", JSON.stringify(experience));
    if (desiredSalary) formData.append("desired_salary", desiredSalary);
    if (referredBy) formData.append("referred_by", referredBy);
    if (website) formData.append("website", website);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/candidates`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to create candidate");
      }

      showSnackbar(isDraft ? "Candidate saved as draft" : "Candidate added successfully", "success");
      navigate(`/jobs/${jobId}`);
    } catch (err) {
      showSnackbar("Failed to add candidate", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        Add New Candidate
      </Typography>

      {/* Personal Information */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Personal Information
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Basic
            </Typography>

            <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
              {/* Avatar Upload */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Box
                  onClick={() => profilePictureInputRef.current?.click()}
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    border: "2px dashed",
                    borderColor: "divider",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    bgcolor: "background.default",
                    overflow: "hidden",
                    "&:hover": { borderColor: "primary.main" },
                  }}
                >
                  {profilePicturePreview ? (
                    <img src={profilePicturePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <>
                      <CameraAlt sx={{ fontSize: 32, color: "text.secondary", mb: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        Upload Avatar
                      </Typography>
                    </>
                  )}
                </Box>
                <input
                  ref={profilePictureInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  style={{ display: "none" }}
                />
              </Box>

              {/* Name Fields */}
              <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Phone No"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Box>
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Current Address"
              value={currentAddress}
              onChange={(e) => setCurrentAddress(e.target.value)}
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Permanent Address"
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
              multiline
              rows={2}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Education */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Education
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {education.map((edu, index) => (
              <Paper key={edu.id} variant="outlined" sx={{ p: 2, position: "relative" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <DragIndicator sx={{ color: "text.secondary", cursor: "grab" }} />
                  <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                    Education {index + 1}
                  </Typography>
                  {education.length > 1 && (
                    <IconButton size="small" onClick={() => removeEducation(edu.id)}>
                      <Close fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Institution Name"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Degree/Field of Study"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                    />
                  </Box>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Location"
                      value={edu.location}
                      onChange={(e) => updateEducation(edu.id, "location", e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Time period"
                      placeholder="e.g., 2018 - 2022"
                      value={edu.startDate}
                      onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                    />
                  </Box>
                </Box>
              </Paper>
            ))}
            <Button startIcon={<Add />} onClick={addEducation} sx={{ alignSelf: "flex-start" }}>
              Add More
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Experience */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Experience
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {experience.map((exp, index) => (
              <Paper key={exp.id} variant="outlined" sx={{ p: 2, position: "relative" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <DragIndicator sx={{ color: "text.secondary", cursor: "grab" }} />
                  <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                    Experience {index + 1}
                  </Typography>
                  {experience.length > 1 && (
                    <IconButton size="small" onClick={() => removeExperience(exp.id)}>
                      <Close fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Institution Name"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Position"
                      value={exp.position}
                      onChange={(e) => updateExperience(exp.id, "position", e.target.value)}
                    />
                  </Box>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Location"
                      value={exp.location}
                      onChange={(e) => updateExperience(exp.id, "location", e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Time period"
                      placeholder="e.g., Jan 2020 - Present"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                    />
                  </Box>
                </Box>
              </Paper>
            ))}
            <Button startIcon={<Add />} onClick={addExperience} sx={{ alignSelf: "flex-start" }}>
              Add More
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Additional Information */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Additional Information
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="Desired Salary"
                type="number"
                value={desiredSalary}
                onChange={(e) => setDesiredSalary(e.target.value)}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
              />
              <TextField
                fullWidth
                label="Referred by"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
              />
            </Box>
            <TextField
              fullWidth
              label="Website/portfolio"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Documents */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Documents
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Resume */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Resume
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  bgcolor: "background.default",
                  border: "2px dashed",
                  borderColor: "divider",
                  "&:hover": { borderColor: "primary.main" },
                }}
                onClick={() => cvInputRef.current?.click()}
              >
                <UploadFile sx={{ fontSize: 32, color: "text.secondary", mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {cv ? cv.name : "Drag & Drop files here or browse from device"}
                </Typography>
              </Paper>
              <input
                ref={cvInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleCvChange}
                style={{ display: "none" }}
              />
              <Typography variant="caption" color="info.main" sx={{ display: "block", mt: 1 }}>
                Documents must be uploaded in PDF, DOC, or DOCX format, and should not exceed 5MB in size.
              </Typography>
            </Box>

            {/* Cover Letter */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Cover Letter
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  bgcolor: "background.default",
                  border: "2px dashed",
                  borderColor: "divider",
                  "&:hover": { borderColor: "primary.main" },
                }}
                onClick={() => coverLetterInputRef.current?.click()}
              >
                <UploadFile sx={{ fontSize: 32, color: "text.secondary", mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {coverLetter ? coverLetter.name : "Drag & Drop files here or browse from device"}
                </Typography>
              </Paper>
              <input
                ref={coverLetterInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleCoverLetterChange}
                style={{ display: "none" }}
              />
              <Typography variant="caption" color="info.main" sx={{ display: "block", mt: 1 }}>
                Documents must be uploaded in PDF, DOC, or DOCX format, and should not exceed 5MB in size.
              </Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Questionaries */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Questionaries
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary">
            No questionaries configured for this job.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
        <Button onClick={() => navigate(`/jobs/${jobId}`)} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="outlined" onClick={() => handleSubmit(true)} disabled={submitting}>
          Save
        </Button>
        <Button variant="contained" onClick={() => handleSubmit(false)} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Now"}
        </Button>
      </Box>
    </Box>
  );
}
