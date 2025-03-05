import React, { useEffect, useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Container,
  Paper,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase-config';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  
  useEffect(() => {
    async function fetchProjects() {
      try {
        if (!auth.currentUser) return;
        const q = query(
          collection(db, 'projects'),
          where('owner', '==', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const projs = [];
        querySnapshot.forEach((docSnap) => {
          projs.push({ id: docSnap.id, ...docSnap.data() });
        });
        setProjects(projs);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    }
    fetchProjects();
  }, [user]);

  
  const handleCreateProject = async () => {
    if (!newProjectName) return;
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name: newProjectName,
        owner: auth.currentUser.uid,
        tasks: [],
      });
      setOpenDialog(false);
      navigate(`/project/${docRef.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  
  const handleLogOut = () => {
    auth.signOut();
  };

  return (
    <>
      
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Projects
          </Typography>
          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccountCircle sx={{ mr: 1 }} />
              <Typography variant="body1">{user.email}</Typography>
              <Button color="inherit" onClick={handleLogOut} sx={{ ml: 2 }}>
                Log Out
              </Button>
            </Box>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>
              Log In
            </Button>
          )}
          <Button color="inherit" onClick={() => setOpenDialog(true)} sx={{ ml: 2 }}>
            Create Project
          </Button>
        </Toolbar>
      </AppBar>

     
      <Container maxWidth="md">
        <Paper sx={{ p: 2 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Your Projects
          </Typography>
          <List>
            {projects.map((project) => (
              <ListItem
                button
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                sx={{
                  mb: 1,
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  boxShadow: 1,
                }}
              >
                <ListItemText primary={project.name} />
              </ListItem>
            ))}
            {projects.length === 0 && (
              <Typography variant="body1">
                No projects found. Create a new one!
              </Typography>
            )}
          </List>
        </Paper>

        
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>New Project</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Project Name"
              fullWidth
              variant="standard"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateProject}>Create</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
