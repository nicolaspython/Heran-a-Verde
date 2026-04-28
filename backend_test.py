#!/usr/bin/env python3
"""
Backend API Testing for Herança Verde Botanical Inventory App
Tests all endpoints in the Next.js catch-all API route
"""

import requests
import json
import sys
import os
from typing import Dict, Any, Optional

# Configuration
BASE_URL = os.getenv("NEXT_PUBLIC_BASE_URL", "http://localhost:3000").rstrip("/") + "/api"
ADMIN_EMAIL = "admin@hercaverde.com"
ADMIN_PASSWORD = "admin123"

# Test data
SAMPLE_BASE64_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

class BackendTester:
    def __init__(self):
        self.token = None
        self.test_results = []
        self.created_ids = {
            'categories': [],
            'species': [],
            'team': []
        }
        
    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> requests.Response:
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        req_headers = headers or {}
        
        if self.token and 'Authorization' not in req_headers:
            req_headers['Authorization'] = f"Bearer {self.token}"
            
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=req_headers, timeout=30)
            elif method.upper() == 'POST':
                req_headers['Content-Type'] = 'application/json'
                response = requests.post(url, json=data, headers=req_headers, timeout=30)
            elif method.upper() == 'PUT':
                req_headers['Content-Type'] = 'application/json'
                response = requests.put(url, json=data, headers=req_headers, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=req_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise
            
    def test_auth_login_success(self):
        """Test successful login"""
        try:
            response = self.make_request('POST', '/auth/login', {
                'email': ADMIN_EMAIL,
                'password': ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                if 'token' in data and 'user' in data:
                    self.token = data['token']
                    user = data['user']
                    if user.get('email') == ADMIN_EMAIL and user.get('role') == 'admin':
                        self.log_result("Auth Login Success", True, f"Token received, user role: {user.get('role')}")
                        return True
                    else:
                        self.log_result("Auth Login Success", False, f"Invalid user data: {user}")
                else:
                    self.log_result("Auth Login Success", False, f"Missing token or user in response: {data}")
            else:
                self.log_result("Auth Login Success", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Auth Login Success", False, f"Exception: {str(e)}")
        return False
        
    def test_auth_login_failure(self):
        """Test login with wrong password"""
        try:
            response = self.make_request('POST', '/auth/login', {
                'email': ADMIN_EMAIL,
                'password': 'wrongpassword'
            })
            
            if response.status_code == 401:
                self.log_result("Auth Login Failure", True, "Correctly rejected wrong password")
                return True
            else:
                self.log_result("Auth Login Failure", False, f"Expected 401, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Auth Login Failure", False, f"Exception: {str(e)}")
        return False
        
    def test_auth_me_with_token(self):
        """Test /auth/me with valid token"""
        if not self.token:
            self.log_result("Auth Me With Token", False, "No token available")
            return False
            
        try:
            response = self.make_request('GET', '/auth/me')
            
            if response.status_code == 200:
                data = response.json()
                if 'user' in data:
                    user = data['user']
                    if user.get('email') == ADMIN_EMAIL and user.get('role') == 'admin':
                        self.log_result("Auth Me With Token", True, f"User verified: {user.get('email')}")
                        return True
                    else:
                        self.log_result("Auth Me With Token", False, f"Invalid user data: {user}")
                else:
                    self.log_result("Auth Me With Token", False, f"Missing user in response: {data}")
            else:
                self.log_result("Auth Me With Token", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Auth Me With Token", False, f"Exception: {str(e)}")
        return False
        
    def test_auth_me_without_token(self):
        """Test /auth/me without token"""
        try:
            response = self.make_request('GET', '/auth/me', headers={'Authorization': ''})
            
            if response.status_code == 401:
                self.log_result("Auth Me Without Token", True, "Correctly rejected request without token")
                return True
            else:
                self.log_result("Auth Me Without Token", False, f"Expected 401, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Auth Me Without Token", False, f"Exception: {str(e)}")
        return False
        
    def test_categories_get(self):
        """Test GET /categories (public endpoint)"""
        try:
            response = self.make_request('GET', '/categories', headers={'Authorization': ''})
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Should have default categories seeded
                    expected_categories = ['Árvore', 'Arbusto', 'Herbácea', 'Medicinal', 'Frutífera', 'Ornamental', 'Palmeira']
                    category_names = [cat.get('name') for cat in data]
                    
                    if len(data) >= 7:  # Should have at least the default categories
                        self.log_result("Categories Get", True, f"Found {len(data)} categories including defaults")
                        return True
                    else:
                        self.log_result("Categories Get", False, f"Expected at least 7 categories, got {len(data)}: {category_names}")
                else:
                    self.log_result("Categories Get", False, f"Expected array, got: {type(data)}")
            else:
                self.log_result("Categories Get", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Categories Get", False, f"Exception: {str(e)}")
        return False
        
    def test_categories_post_without_token(self):
        """Test POST /categories without token"""
        try:
            response = self.make_request('POST', '/categories', 
                                       {'name': 'Test Category'}, 
                                       headers={'Authorization': ''})
            
            if response.status_code == 401:
                self.log_result("Categories Post Without Token", True, "Correctly rejected request without token")
                return True
            else:
                self.log_result("Categories Post Without Token", False, f"Expected 401, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Categories Post Without Token", False, f"Exception: {str(e)}")
        return False
        
    def test_categories_crud(self):
        """Test Categories CRUD operations"""
        if not self.token:
            self.log_result("Categories CRUD", False, "No token available")
            return False
            
        # CREATE
        try:
            response = self.make_request('POST', '/categories', {'name': 'Cactácea'})
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and data.get('name') == 'Cactácea':
                    category_id = data['id']
                    self.created_ids['categories'].append(category_id)
                    self.log_result("Categories Create", True, f"Created category with ID: {category_id}")
                    
                    # UPDATE
                    response = self.make_request('PUT', f'/categories/{category_id}', {'name': 'Cactáceas'})
                    if response.status_code == 200:
                        updated_data = response.json()
                        if updated_data.get('name') == 'Cactáceas':
                            self.log_result("Categories Update", True, "Successfully updated category name")
                            
                            # DELETE
                            response = self.make_request('DELETE', f'/categories/{category_id}')
                            if response.status_code == 200:
                                self.log_result("Categories Delete", True, "Successfully deleted category")
                                self.created_ids['categories'].remove(category_id)
                                return True
                            else:
                                self.log_result("Categories Delete", False, f"Delete failed: {response.status_code}")
                        else:
                            self.log_result("Categories Update", False, f"Update failed: {updated_data}")
                    else:
                        self.log_result("Categories Update", False, f"Update failed: {response.status_code}")
                else:
                    self.log_result("Categories Create", False, f"Invalid create response: {data}")
            else:
                self.log_result("Categories Create", False, f"Create failed: {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Categories CRUD", False, f"Exception: {str(e)}")
        return False
        
    def test_species_crud(self):
        """Test Species CRUD operations"""
        if not self.token:
            self.log_result("Species CRUD", False, "No token available")
            return False
            
        # First get a category ID
        try:
            response = self.make_request('GET', '/categories', headers={'Authorization': ''})
            if response.status_code != 200:
                self.log_result("Species CRUD", False, "Could not fetch categories")
                return False
                
            categories = response.json()
            if not categories:
                self.log_result("Species CRUD", False, "No categories available")
                return False
                
            # Find "Árvore" category
            arvore_category = next((cat for cat in categories if cat.get('name') == 'Árvore'), categories[0])
            category_id = arvore_category['id']
            
            # CREATE Species
            species_data = {
                'scientificName': 'Mangifera indica',
                'commonName': 'Mangueira',
                'family': 'Anacardiaceae',
                'categoryId': category_id,
                'description': 'Árvore frutífera tropical originária da Ásia',
                'characteristics': 'Folhas perenes, frutos doces e aromáticos',
                'location': 'Pátio central',
                'images': [SAMPLE_BASE64_IMAGE]
            }
            
            response = self.make_request('POST', '/species', species_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and data.get('scientificName') == 'Mangifera indica':
                    species_id = data['id']
                    self.created_ids['species'].append(species_id)
                    
                    # Verify categoryName is populated
                    if data.get('categoryName') == 'Árvore':
                        self.log_result("Species Create", True, f"Created species with ID: {species_id}, categoryName populated")
                        
                        # Test GET /species (list)
                        response = self.make_request('GET', '/species', headers={'Authorization': ''})
                        if response.status_code == 200:
                            species_list = response.json()
                            if any(s.get('id') == species_id for s in species_list):
                                self.log_result("Species List", True, f"Species found in list ({len(species_list)} total)")
                                
                                # Test search
                                response = self.make_request('GET', '/species?search=manga', headers={'Authorization': ''})
                                if response.status_code == 200:
                                    search_results = response.json()
                                    if any(s.get('id') == species_id for s in search_results):
                                        self.log_result("Species Search", True, "Search by 'manga' found the species")
                                    else:
                                        self.log_result("Species Search", False, "Search did not find the species")
                                        
                                # Test category filter
                                response = self.make_request('GET', f'/species?category={category_id}', headers={'Authorization': ''})
                                if response.status_code == 200:
                                    filtered_results = response.json()
                                    if any(s.get('id') == species_id for s in filtered_results):
                                        self.log_result("Species Category Filter", True, "Category filter found the species")
                                    else:
                                        self.log_result("Species Category Filter", False, "Category filter did not find the species")
                                        
                                # Test GET single species
                                response = self.make_request('GET', f'/species/{species_id}', headers={'Authorization': ''})
                                if response.status_code == 200:
                                    single_species = response.json()
                                    if single_species.get('id') == species_id:
                                        self.log_result("Species Get Single", True, "Retrieved single species successfully")
                                        
                                        # Test UPDATE
                                        update_data = {**species_data, 'commonName': 'Mangueira Atualizada'}
                                        response = self.make_request('PUT', f'/species/{species_id}', update_data)
                                        if response.status_code == 200:
                                            updated_species = response.json()
                                            if updated_species.get('commonName') == 'Mangueira Atualizada':
                                                self.log_result("Species Update", True, "Successfully updated species")
                                                
                                                # Test DELETE
                                                response = self.make_request('DELETE', f'/species/{species_id}')
                                                if response.status_code == 200:
                                                    self.log_result("Species Delete", True, "Successfully deleted species")
                                                    self.created_ids['species'].remove(species_id)
                                                    return True
                                                else:
                                                    self.log_result("Species Delete", False, f"Delete failed: {response.status_code}")
                                            else:
                                                self.log_result("Species Update", False, f"Update failed: {updated_species}")
                                        else:
                                            self.log_result("Species Update", False, f"Update failed: {response.status_code}")
                                    else:
                                        self.log_result("Species Get Single", False, f"Wrong species returned: {single_species}")
                                else:
                                    self.log_result("Species Get Single", False, f"Get single failed: {response.status_code}")
                            else:
                                self.log_result("Species List", False, "Species not found in list")
                        else:
                            self.log_result("Species List", False, f"List failed: {response.status_code}")
                    else:
                        self.log_result("Species Create", False, f"categoryName not populated: {data.get('categoryName')}")
                else:
                    self.log_result("Species Create", False, f"Invalid create response: {data}")
            else:
                self.log_result("Species Create", False, f"Create failed: {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Species CRUD", False, f"Exception: {str(e)}")
        return False
        
    def test_species_post_without_token(self):
        """Test POST /species without token"""
        try:
            response = self.make_request('POST', '/species', 
                                       {'scientificName': 'Test Species'}, 
                                       headers={'Authorization': ''})
            
            if response.status_code == 401:
                self.log_result("Species Post Without Token", True, "Correctly rejected request without token")
                return True
            else:
                self.log_result("Species Post Without Token", False, f"Expected 401, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Species Post Without Token", False, f"Exception: {str(e)}")
        return False
        
    def test_team_crud(self):
        """Test Team CRUD operations including reorder and main creator logic"""
        if not self.token:
            self.log_result("Team CRUD", False, "No token available")
            return False
            
        try:
            # CREATE first team member (main creator)
            team_data_1 = {
                'name': 'Profa. Ana Silva',
                'role': 'Coordenadora',
                'description': 'Coordenadora do projeto Herança Verde',
                'photo': SAMPLE_BASE64_IMAGE,
                'socialLinks': [{'label': 'LinkedIn', 'url': 'https://linkedin.com/in/ana-silva'}],
                'isMainCreator': True
            }
            
            response = self.make_request('POST', '/team', team_data_1)
            
            if response.status_code == 200:
                data_1 = response.json()
                if 'id' in data_1 and data_1.get('name') == 'Profa. Ana Silva':
                    team_id_1 = data_1['id']
                    self.created_ids['team'].append(team_id_1)
                    
                    if data_1.get('isMainCreator') == True:
                        self.log_result("Team Create First", True, f"Created first team member as main creator: {team_id_1}")
                        
                        # CREATE second team member (also trying to be main creator)
                        team_data_2 = {
                            'name': 'Dr. João Santos',
                            'role': 'Pesquisador',
                            'description': 'Especialista em botânica',
                            'photo': SAMPLE_BASE64_IMAGE,
                            'socialLinks': [{'label': 'Email', 'url': 'mailto:joao@example.com'}],
                            'isMainCreator': True  # This should make the first one false
                        }
                        
                        response = self.make_request('POST', '/team', team_data_2)
                        if response.status_code == 200:
                            data_2 = response.json()
                            team_id_2 = data_2['id']
                            self.created_ids['team'].append(team_id_2)
                            
                            if data_2.get('isMainCreator') == True:
                                self.log_result("Team Create Second", True, f"Created second team member as main creator: {team_id_2}")
                                
                                # Verify first member is no longer main creator
                                response = self.make_request('GET', '/team', headers={'Authorization': ''})
                                if response.status_code == 200:
                                    team_list = response.json()
                                    first_member = next((m for m in team_list if m.get('id') == team_id_1), None)
                                    second_member = next((m for m in team_list if m.get('id') == team_id_2), None)
                                    
                                    if first_member and second_member:
                                        if first_member.get('isMainCreator') == False and second_member.get('isMainCreator') == True:
                                            self.log_result("Team Main Creator Logic", True, "Only one main creator maintained correctly")
                                            
                                            # Test reorder
                                            original_order = [m['id'] for m in sorted(team_list, key=lambda x: x.get('order', 0))]
                                            new_order = [team_id_2, team_id_1]  # Reverse order
                                            
                                            response = self.make_request('POST', '/team/reorder', {'ids': new_order})
                                            if response.status_code == 200:
                                                # Verify order changed
                                                response = self.make_request('GET', '/team', headers={'Authorization': ''})
                                                if response.status_code == 200:
                                                    updated_list = response.json()
                                                    updated_order = [m['id'] for m in sorted(updated_list, key=lambda x: x.get('order', 0))]
                                                    
                                                    if updated_order == new_order:
                                                        self.log_result("Team Reorder", True, f"Successfully reordered team: {updated_order}")
                                                        
                                                        # Test UPDATE
                                                        update_data = {**team_data_1, 'name': 'Profa. Ana Silva Atualizada'}
                                                        response = self.make_request('PUT', f'/team/{team_id_1}', update_data)
                                                        if response.status_code == 200:
                                                            updated_member = response.json()
                                                            if updated_member.get('name') == 'Profa. Ana Silva Atualizada':
                                                                self.log_result("Team Update", True, "Successfully updated team member")
                                                                
                                                                # Test DELETE
                                                                response = self.make_request('DELETE', f'/team/{team_id_1}')
                                                                if response.status_code == 200:
                                                                    response = self.make_request('DELETE', f'/team/{team_id_2}')
                                                                    if response.status_code == 200:
                                                                        self.log_result("Team Delete", True, "Successfully deleted team members")
                                                                        self.created_ids['team'].remove(team_id_1)
                                                                        self.created_ids['team'].remove(team_id_2)
                                                                        return True
                                                                    else:
                                                                        self.log_result("Team Delete", False, f"Delete second member failed: {response.status_code}")
                                                                else:
                                                                    self.log_result("Team Delete", False, f"Delete first member failed: {response.status_code}")
                                                            else:
                                                                self.log_result("Team Update", False, f"Update failed: {updated_member}")
                                                        else:
                                                            self.log_result("Team Update", False, f"Update failed: {response.status_code}")
                                                    else:
                                                        self.log_result("Team Reorder", False, f"Order not changed: expected {new_order}, got {updated_order}")
                                                else:
                                                    self.log_result("Team Reorder", False, f"Could not verify reorder: {response.status_code}")
                                            else:
                                                self.log_result("Team Reorder", False, f"Reorder failed: {response.status_code}")
                                        else:
                                            self.log_result("Team Main Creator Logic", False, f"Main creator logic failed: first={first_member.get('isMainCreator')}, second={second_member.get('isMainCreator')}")
                                    else:
                                        self.log_result("Team Main Creator Logic", False, "Could not find team members in list")
                                else:
                                    self.log_result("Team Main Creator Logic", False, f"Could not get team list: {response.status_code}")
                            else:
                                self.log_result("Team Create Second", False, f"Second member not main creator: {data_2}")
                        else:
                            self.log_result("Team Create Second", False, f"Create second failed: {response.status_code}")
                    else:
                        self.log_result("Team Create First", False, f"First member not main creator: {data_1}")
                else:
                    self.log_result("Team Create First", False, f"Invalid create response: {data_1}")
            else:
                self.log_result("Team Create First", False, f"Create failed: {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Team CRUD", False, f"Exception: {str(e)}")
        return False
        
    def test_export(self):
        """Test Export functionality"""
        if not self.token:
            self.log_result("Export", False, "No token available")
            return False
            
        try:
            # Test export without token
            response = self.make_request('GET', '/export?type=species&format=json', headers={'Authorization': ''})
            if response.status_code == 401:
                self.log_result("Export Without Token", True, "Correctly rejected request without token")
                
                # Test JSON export
                response = self.make_request('GET', '/export?type=species&format=json')
                if response.status_code == 200:
                    if 'application/json' in response.headers.get('Content-Type', ''):
                        if 'attachment' in response.headers.get('Content-Disposition', ''):
                            try:
                                data = response.json()
                                if isinstance(data, list):
                                    self.log_result("Export JSON", True, f"JSON export successful, {len(data)} items")
                                    
                                    # Test CSV export
                                    response = self.make_request('GET', '/export?type=species&format=csv')
                                    if response.status_code == 200:
                                        if 'text/csv' in response.headers.get('Content-Type', ''):
                                            csv_content = response.text
                                            if csv_content and '\n' in csv_content:  # Should have header line
                                                self.log_result("Export CSV", True, f"CSV export successful, {len(csv_content.split(chr(10)))} lines")
                                                
                                                # Test team export
                                                response = self.make_request('GET', '/export?type=team&format=csv')
                                                if response.status_code == 200:
                                                    self.log_result("Export Team CSV", True, "Team CSV export successful")
                                                    return True
                                                else:
                                                    self.log_result("Export Team CSV", False, f"Team export failed: {response.status_code}")
                                            else:
                                                self.log_result("Export CSV", False, "CSV content invalid")
                                        else:
                                            self.log_result("Export CSV", False, f"Wrong content type: {response.headers.get('Content-Type')}")
                                    else:
                                        self.log_result("Export CSV", False, f"CSV export failed: {response.status_code}")
                                else:
                                    self.log_result("Export JSON", False, f"JSON data not array: {type(data)}")
                            except json.JSONDecodeError:
                                self.log_result("Export JSON", False, "Invalid JSON response")
                        else:
                            self.log_result("Export JSON", False, f"Missing attachment header: {response.headers.get('Content-Disposition')}")
                    else:
                        self.log_result("Export JSON", False, f"Wrong content type: {response.headers.get('Content-Type')}")
                else:
                    self.log_result("Export JSON", False, f"JSON export failed: {response.status_code}")
            else:
                self.log_result("Export Without Token", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_result("Export", False, f"Exception: {str(e)}")
        return False
        
    def test_stats(self):
        """Test Stats endpoint"""
        try:
            response = self.make_request('GET', '/stats', headers={'Authorization': ''})
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['speciesCount', 'teamCount', 'categoriesCount']
                
                if all(field in data for field in required_fields):
                    if all(isinstance(data[field], int) for field in required_fields):
                        self.log_result("Stats", True, f"Stats: species={data['speciesCount']}, team={data['teamCount']}, categories={data['categoriesCount']}")
                        return True
                    else:
                        self.log_result("Stats", False, f"Non-integer values in stats: {data}")
                else:
                    self.log_result("Stats", False, f"Missing required fields: {data}")
            else:
                self.log_result("Stats", False, f"Stats failed: {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Stats", False, f"Exception: {str(e)}")
        return False
        
    def cleanup(self):
        """Clean up any created test data"""
        if not self.token:
            return
            
        # Clean up in reverse order
        for species_id in self.created_ids['species']:
            try:
                self.make_request('DELETE', f'/species/{species_id}')
            except:
                pass
                
        for team_id in self.created_ids['team']:
            try:
                self.make_request('DELETE', f'/team/{team_id}')
            except:
                pass
                
        for category_id in self.created_ids['categories']:
            try:
                self.make_request('DELETE', f'/categories/{category_id}')
            except:
                pass
                
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🧪 Starting Backend API Tests for Herança Verde")
        print(f"🌐 Base URL: {BASE_URL}")
        print(f"👤 Admin: {ADMIN_EMAIL}")
        print("=" * 60)
        
        try:
            # 1. Auth Tests
            print("\n🔐 Testing Authentication...")
            self.test_auth_login_success()
            self.test_auth_login_failure()
            self.test_auth_me_with_token()
            self.test_auth_me_without_token()
            
            # 2. Categories Tests
            print("\n📂 Testing Categories...")
            self.test_categories_get()
            self.test_categories_post_without_token()
            self.test_categories_crud()
            
            # 3. Species Tests
            print("\n🌱 Testing Species...")
            self.test_species_post_without_token()
            self.test_species_crud()
            
            # 4. Team Tests
            print("\n👥 Testing Team...")
            self.test_team_crud()
            
            # 5. Export Tests
            print("\n📤 Testing Export...")
            self.test_export()
            
            # 6. Stats Tests
            print("\n📊 Testing Stats...")
            self.test_stats()
            
        finally:
            # Cleanup
            print("\n🧹 Cleaning up test data...")
            self.cleanup()
            
        # Summary
        print("\n" + "=" * 60)
        print("📋 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}")
            
        print(f"\n🎯 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Backend is working correctly.")
            return True
        else:
            print(f"⚠️  {total - passed} tests failed. Check details above.")
            return False

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)