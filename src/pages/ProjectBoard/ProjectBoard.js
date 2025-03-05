
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { db } from '../../firebase-config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';


function DroppableColumn({ id, children }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
}


function Task({ id, content, assignedTo }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '8px',
    marginBottom: '8px',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'grab',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Typography variant="body1">{content}</Typography>
      <Typography variant="caption">Assigned To: {assignedTo}</Typography>
    </div>
  );
}

export default function ProjectBoard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [columns, setColumns] = useState({
    'To Do': [],
    'In Progress': [],
    'Done': [],
  });

  
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('To Do');

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );

  
  useEffect(() => {
    async function fetchProject() {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        setProject({ id: projectId, ...projectData });
        const newColumns = {
          'To Do': [],
          'In Progress': [],
          'Done': [],
        };
        (projectData.tasks || []).forEach((task) => {
          if (newColumns[task.status]) {
            newColumns[task.status].push(task);
          }
        });
        setColumns(newColumns);
      }
    }
    fetchProject();
  }, [projectId]);

  
  const handleAddTask = async () => {
    if (!newTaskContent || !newTaskAssignedTo) return;
    const newTask = {
      id: `task-${Date.now()}`,
      content: newTaskContent,
      assignedTo: newTaskAssignedTo,
      status: newTaskStatus,
    };
    const updatedColumns = { ...columns };
    updatedColumns[newTaskStatus] = [...updatedColumns[newTaskStatus], newTask];
    setColumns(updatedColumns);

    
    const updatedTasks = [];
    Object.keys(updatedColumns).forEach((status) => {
      updatedTasks.push(...updatedColumns[status]);
    });
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { tasks: updatedTasks });

    setOpenTaskDialog(false);
    setNewTaskContent('');
    setNewTaskAssignedTo('');
    setNewTaskStatus('To Do');
  };

  
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    let sourceColumn, sourceIndex, destinationColumn, destinationIndex;

    
    Object.keys(columns).forEach((status) => {
      columns[status].forEach((task, index) => {
        if (task.id === active.id) {
          sourceColumn = status;
          sourceIndex = index;
        }
      });
    });

   
    Object.keys(columns).forEach((status) => {
      if (!destinationColumn) {
        if (columns[status].length === 0 && over.id === status) {
          destinationColumn = status;
          destinationIndex = 0;
        } else {
          columns[status].forEach((task, index) => {
            if (task.id === over.id) {
              destinationColumn = status;
              destinationIndex = index;
            }
          });
        }
      }
    });

    if (sourceColumn === undefined || destinationColumn === undefined) return;

    const updatedColumns = { ...columns };
    if (sourceColumn === destinationColumn) {
      updatedColumns[sourceColumn] = arrayMove(
        updatedColumns[sourceColumn],
        sourceIndex,
        destinationIndex
      );
    } else {
      const [movedTask] = updatedColumns[sourceColumn].splice(sourceIndex, 1);
      movedTask.status = destinationColumn;
      updatedColumns[destinationColumn].splice(destinationIndex, 0, movedTask);
    }
    setColumns(updatedColumns);

    
    const updatedTasks = [];
    Object.keys(updatedColumns).forEach((status) => {
      updatedTasks.push(...updatedColumns[status]);
    });
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { tasks: updatedTasks });
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {project ? project.name : 'Project Board'}
          </Typography>
          <Button color="inherit" onClick={() => setOpenTaskDialog(true)}>
            Add Task
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Box sx={{ display: 'flex', gap: 2 }}>
            {Object.keys(columns).map((status) => (
              <Box key={status} sx={{ flex: 1 }}>
                <Typography variant="h6" align="center" sx={{ mb: 1 }}>
                  {status}
                </Typography>
                {/* Wrap Paper in DroppableColumn to register the column even when empty */}
                <DroppableColumn id={status}>
                  <Paper sx={{ p: 2, minHeight: 300 }}>
                    <SortableContext items={columns[status]} strategy={verticalListSortingStrategy}>
                      {columns[status].map((task) => (
                        <Task
                          key={task.id}
                          id={task.id}
                          content={task.content}
                          assignedTo={task.assignedTo}
                        />
                      ))}
                    </SortableContext>
                  </Paper>
                </DroppableColumn>
              </Box>
            ))}
          </Box>
        </DndContext>
      </Box>

      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)}>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Content"
            fullWidth
            variant="standard"
            value={newTaskContent}
            onChange={(e) => setNewTaskContent(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Assign (Email)"
            fullWidth
            variant="standard"
            value={newTaskAssignedTo}
            onChange={(e) => setNewTaskAssignedTo(e.target.value)}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newTaskStatus}
              onChange={(e) => setNewTaskStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="To Do">To Do</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Done">Done</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTaskDialog(false)}>Cancel</Button>
          <Button onClick={handleAddTask}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
