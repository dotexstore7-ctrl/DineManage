
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

interface CreateMenuItemModalProps {
  onClose: () => void;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: string;
}

interface MenuItemIngredient {
  ingredientId: string;
  quantity: string;
  ingredientName?: string;
  unit?: string;
}

export function CreateMenuItemModal({ onClose }: CreateMenuItemModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "restaurant",
    isActive: true,
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<MenuItemIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const { toast } = useToast();

  // Fetch available ingredients on component mount
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await fetch("/api/ingredients");
        if (response.ok) {
          const data = await response.json();
          setIngredients(data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch ingredients",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch ingredients",
          variant: "destructive",
        });
      } finally {
        setLoadingIngredients(false);
      }
    };

    fetchIngredients();
  }, [toast]);

  const addIngredient = () => {
    setSelectedIngredients([
      ...selectedIngredients,
      { ingredientId: "", quantity: "" }
    ]);
  };

  const removeIngredient = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof MenuItemIngredient, value: string) => {
    const updated = [...selectedIngredients];
    updated[index] = { ...updated[index], [field]: value };
    
    // If updating ingredientId, also update the ingredient name and unit for display
    if (field === 'ingredientId') {
      const selectedIng = ingredients.find(ing => ing.id === value);
      if (selectedIng) {
        updated[index].ingredientName = selectedIng.name;
        updated[index].unit = selectedIng.unit;
      }
    }
    
    setSelectedIngredients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all selected ingredients have quantities
    const invalidIngredients = selectedIngredients.filter(
      ing => !ing.ingredientId || !ing.quantity || parseFloat(ing.quantity) <= 0
    );
    
    if (invalidIngredients.length > 0) {
      toast({
        title: "Error",
        description: "Please complete all ingredient selections and quantities",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // First create the menu item
      const menuItemResponse = await fetch("/api/menu-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      });

      if (!menuItemResponse.ok) {
        const error = await menuItemResponse.json();
        throw new Error(error.message || "Failed to create menu item");
      }

      const menuItem = await menuItemResponse.json();

      // Then add each ingredient to the menu item
      for (const ingredient of selectedIngredients) {
        const ingredientResponse = await fetch(`/api/menu-items/${menuItem.id}/ingredients`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ingredientId: ingredient.ingredientId,
            quantity: parseFloat(ingredient.quantity),
          }),
        });

        if (!ingredientResponse.ok) {
          console.warn(`Failed to add ingredient ${ingredient.ingredientId} to menu item`);
        }
      }

      toast({
        title: "Success",
        description: `Menu item created successfully with ${selectedIngredients.length} ingredients`,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create menu item",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Add Menu Item
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <i className="fas fa-times"></i>
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Menu Item Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Chicken Fried Rice"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the item"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (Rs.)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="restaurant">Restaurant</option>
                    <option value="bar">Bar</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Available for ordering
                </label>
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Ingredients</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredient}
                  disabled={loadingIngredients}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Ingredient
                </Button>
              </div>

              {loadingIngredients ? (
                <p className="text-gray-500 text-center py-4">Loading ingredients...</p>
              ) : ingredients.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No ingredients available. Please add ingredients to the system first.</p>
              ) : (
                <div className="space-y-3">
                  {selectedIngredients.map((selectedIng, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-md">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Ingredient
                        </label>
                        <select
                          value={selectedIng.ingredientId}
                          onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select ingredient...</option>
                          {ingredients.map((ingredient) => (
                            <option key={ingredient.id} value={ingredient.id}>
                              {ingredient.name} (Stock: {ingredient.currentStock} {ingredient.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="w-32">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Quantity {selectedIng.unit && `(${selectedIng.unit})`}
                        </label>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          value={selectedIng.quantity}
                          onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                          placeholder="0.000"
                          className="text-sm"
                          required
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  {selectedIngredients.length === 0 && (
                    <p className="text-gray-500 text-center py-4 italic">
                      No ingredients added yet. Click "Add Ingredient" to start adding ingredients.
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Creating..." : "Create Menu Item"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
